package main

import (
	"errors"
	"fmt"
	"github.com/dop251/goja/ast"
	"github.com/dop251/goja/parser"
	"math"
	"sync"
	"time"
	"reflect"
	"strings"
)

// ValueType represents the type of a JavaScript value
type ValueType int

const (
	TypeUndefined ValueType = iota
	TypeNull
	TypeBoolean
	TypeNumber
	TypeString
	TypeObject
	TypeFunction
)

// Value represents a JavaScript value with memory size tracking
type Value struct {
	Type ValueType
	Data interface{}
	Size uint64 // Memory size in bytes
}

// Property represents a JavaScript object property
type Property struct {
	Value       Value
	Enumerable  bool
	Writable    bool
	Configurable bool
}

// Object represents a JavaScript object
type Object struct {
	Properties map[string]Property
	Size       uint64 // Base size + properties
}

// Scope represents a variable scope in JavaScript
type Scope struct {
	Values map[string]Value
	Parent *Scope
}

// TimeoutTask represents a scheduled setTimeout function
type TimeoutTask struct {
	Fn         func() Value
	TriggerTime time.Time
	ID         int
}

// JSVM represents our JavaScript virtual machine
type JSVM struct {
	memoryUsed    uint64
	memoryLimit   uint64
	startTime     time.Time
	timeLimit     time.Duration
	output        chan interface{}
	globalScope   *Scope
	timeoutTasks  []*TimeoutTask
	timeoutsMutex sync.Mutex
	nextTimeoutID int
	stopped       bool
}

// NewJSVM creates a new JavaScript VM with the specified memory and time limits
func NewJSVM(memoryLimitKB uint64, timeLimitMS uint64) *JSVM {
	vm := &JSVM{
		memoryUsed:   0,
		memoryLimit:  memoryLimitKB * 1024,
		timeLimit:    time.Duration(timeLimitMS) * time.Millisecond,
		output:       make(chan interface{}, 100),
		globalScope:  &Scope{Values: make(map[string]Value)},
		timeoutTasks: make([]*TimeoutTask, 0),
		stopped:      false,
	}
	
	// Initialize built-in objects and functions
	vm.initBuiltins()
	
	return vm
}

// Execute parses and executes JavaScript code
func (vm *JSVM) Execute(code string) (interface{}, uint64, error) {
	// Reset execution state
	vm.startTime = time.Now()
	vm.stopped = false
	vm.memoryUsed = 0
	
	// Parse the JavaScript code
	program, err := parser.ParseFile(nil, "", code, 0)
	if err != nil {
		return nil, 0, fmt.Errorf("parse error: %v", err)
	}
	
	// Create a goroutine to process timeouts
	done := make(chan struct{})
	go vm.processTimeoutsAsync(done)
	
	// Execute the program
	result, err := vm.executeProgram(program)
	if err != nil {
		close(done)
		return nil, vm.memoryUsed, err
	}
	
	// Wait for timeouts to complete
	close(done)
	
	return result.Data, vm.memoryUsed, nil
}

// allocateMemory attempts to allocate memory and returns success
func (vm *JSVM) allocateMemory(size uint64) bool {
	if vm.memoryUsed+size > vm.memoryLimit {
		vm.stopped = true
		return false
	}
	vm.memoryUsed += size
	return true
}

// checkTimeLimit checks if execution time limit has been reached
func (vm *JSVM) checkTimeLimit() bool {
	if time.Since(vm.startTime) > vm.timeLimit {
		vm.stopped = true
		return false
	}
	return true
}

// initBuiltins initializes built-in objects and functions
func (vm *JSVM) initBuiltins() {
	// Console object
	consoleObj := Value{
		Type: TypeObject,
		Data: &Object{
			Properties: map[string]Property{
				"log": {
					Value: Value{
						Type: TypeFunction,
						Data: func(args []Value) Value {
							for _, arg := range args {
								fmt.Printf("%v ", arg.Data)
							}
							fmt.Println()
							return Value{Type: TypeUndefined}
						},
						Size: 8,
					},
					Enumerable: true,
					Writable: true,
				},
				"error": {
					Value: Value{
						Type: TypeFunction,
						Data: func(args []Value) Value {
							fmt.Print("ERROR: ")
							for _, arg := range args {
								fmt.Printf("%v ", arg.Data)
							}
							fmt.Println()
							return Value{Type: TypeUndefined}
						},
						Size: 8,
					},
					Enumerable: true,
					Writable: true,
				},
				// Add other console methods as needed
			},
			Size: 64,
		},
		Size: 64,
	}
	vm.globalScope.Values["console"] = consoleObj

	// setTimeout function
	vm.globalScope.Values["setTimeout"] = Value{
		Type: TypeFunction,
		Data: func(args []Value) Value {
			if len(args) < 2 {
				return Value{Type: TypeNumber, Data: 0.0}
			}
			
			callback := args[0]
			if callback.Type != TypeFunction {
				return Value{Type: TypeNumber, Data: 0.0}
			}
			
			var delay float64 = 0
			if args[1].Type == TypeNumber {
				delay = args[1].Data.(float64)
			}
			
			vm.timeoutsMutex.Lock()
			id := vm.nextTimeoutID
			vm.nextTimeoutID++
			
			vm.timeoutTasks = append(vm.timeoutTasks, &TimeoutTask{
				Fn: func() Value {
					fn := callback.Data.(func([]Value) Value)
					return fn([]Value{})
				},
				TriggerTime: time.Now().Add(time.Duration(delay) * time.Millisecond),
				ID: id,
			})
			vm.timeoutsMutex.Unlock()
			
			return Value{Type: TypeNumber, Data: float64(id)}
		},
		Size: 8,
	}
}

// processTimeoutsAsync processes timeouts in the background
func (vm *JSVM) processTimeoutsAsync(done <-chan struct{}) {
	ticker := time.NewTicker(10 * time.Millisecond)
	defer ticker.Stop()
	
	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			vm.processTimeouts()
		}
	}
}

// processTimeouts executes any due timeout tasks
func (vm *JSVM) processTimeouts() {
	now := time.Now()
	
	vm.timeoutsMutex.Lock()
	defer vm.timeoutsMutex.Unlock()
	
	tasksToRun := make([]*TimeoutTask, 0)
	remainingTasks := make([]*TimeoutTask, 0)
	
	// Separate tasks to run from those to keep
	for _, task := range vm.timeoutTasks {
		if task.TriggerTime.Before(now) {
			tasksToRun = append(tasksToRun, task)
		} else {
			remainingTasks = append(remainingTasks, task)
		}
	}
	
	vm.timeoutTasks = remainingTasks
	
	// Run tasks outside of the lock
	vm.timeoutsMutex.Unlock()
	for _, task := range tasksToRun {
		if vm.stopped || !vm.checkTimeLimit() {
			break
		}
		task.Fn()
	}
	vm.timeoutsMutex.Lock()
}

// executeProgram executes an AST program
func (vm *JSVM) executeProgram(program *ast.Program) (Value, error) {
	if !vm.checkTimeLimit() {
		return Value{}, errors.New("time limit exceeded before execution")
	}
	
	var lastValue Value = Value{Type: TypeUndefined}
	
	// Execute each statement in the program
	for _, stmt := range program.Body {
		if vm.stopped {
			return Value{}, errors.New("execution stopped: resource limit reached")
		}
		
		value, err := vm.evaluateStatement(stmt, vm.globalScope)
		if err != nil {
			return Value{}, err
		}
		lastValue = value
		
		// Check resource limits after each statement
		if !vm.checkTimeLimit() {
			return Value{}, errors.New("time limit exceeded")
		}
	}
	
	return lastValue, nil
}

// evaluateStatement evaluates a JavaScript statement
func (vm *JSVM) evaluateStatement(stmt ast.Statement, scope *Scope) (Value, error) {
	if !vm.checkTimeLimit() {
		return Value{}, errors.New("time limit exceeded")
	}
	
	switch s := stmt.(type) {
	case *ast.ExpressionStatement:
		return vm.evaluateExpression(s.Expression, scope)
		
	case *ast.BlockStatement:
		return vm.evaluateBlockStatement(s, scope)
		
	case *ast.VariableStatement:
		return vm.evaluateVariableStatement(s, scope)
		
	case *ast.IfStatement:
		return vm.evaluateIfStatement(s, scope)
		
	case *ast.ForStatement:
		return vm.evaluateForStatement(s, scope)
		
	case *ast.ReturnStatement:
		if s.Argument == nil {
			return Value{Type: TypeUndefined}, nil
		}
		return vm.evaluateExpression(s.Argument, scope)
		
	case *ast.FunctionStatement:
		return vm.evaluateFunction(s.Function, scope)
		
	default:
		return Value{Type: TypeUndefined}, fmt.Errorf("unsupported statement type: %T", stmt)
	}
}

// evaluateBlockStatement evaluates a block of statements
func (vm *JSVM) evaluateBlockStatement(block *ast.BlockStatement, parentScope *Scope) (Value, error) {
	// Create a new scope for the block
	blockScope := &Scope{
		Values: make(map[string]Value),
		Parent: parentScope,
	}
	
	var lastValue Value = Value{Type: TypeUndefined}
	
	for _, stmt := range block.List {
		if vm.stopped {
			return Value{}, errors.New("execution stopped")
		}
		
		value, err := vm.evaluateStatement(stmt, blockScope)
		if err != nil {
			return Value{}, err
		}
		lastValue = value
		
		// Check resource limits after each statement
		if !vm.checkTimeLimit() {
			return Value{}, errors.New("time limit exceeded")
		}
	}
	
	return lastValue, nil
}

// evaluateExpression evaluates a JavaScript expression
func (vm *JSVM) evaluateExpression(expr ast.Expression, scope *Scope) (Value, error) {
	if !vm.checkTimeLimit() {
		return Value{}, errors.New("time limit exceeded")
	}
	
	switch e := expr.(type) {
	case *ast.Literal:
		return vm.evaluateLiteral(e)
		
	case *ast.BinaryExpression:
		return vm.evaluateBinaryExpression(e, scope)
		
	case *ast.UnaryExpression:
		return vm.evaluateUnaryExpression(e, scope)
		
	case *ast.CallExpression:
		return vm.evaluateCallExpression(e, scope)
		
	case *ast.Identifier:
		return vm.resolveIdentifier(e.Name, scope)
		
	case *ast.AssignExpression:
		return vm.evaluateAssignExpression(e, scope)
		
	case *ast.ObjectLiteral:
		return vm.evaluateObjectLiteral(e, scope)
		
	case *ast.ArrayLiteral:
		return vm.evaluateArrayLiteral(e, scope)
		
	case *ast.FunctionLiteral:
		return vm.evaluateFunction(e, scope)
		
	default:
		return Value{Type: TypeUndefined}, fmt.Errorf("unsupported expression type: %T", expr)
	}
}

// evaluateLiteral evaluates a literal value (number, string, boolean, etc.)
func (vm *JSVM) evaluateLiteral(lit *ast.Literal) (Value, error) {
	switch lit.Token {
	case token.STRING:
		strValue := lit.Value.(string)
		size := uint64(len(strValue))
		if !vm.allocateMemory(size) {
			return Value{}, errors.New("memory limit exceeded")
		}
		return Value{Type: TypeString, Data: strValue, Size: size}, nil
		
	case token.NUMBER:
		// All numbers in JavaScript are 64-bit floating point
		return Value{Type: TypeNumber, Data: lit.Value.(float64), Size: 8}, nil
		
	case token.BOOLEAN:
		return Value{Type: TypeBoolean, Data: lit.Value.(bool), Size: 1}, nil
		
	case token.NULL:
		return Value{Type: TypeNull, Size: 0}, nil
		
	default:
		return Value{Type: TypeUndefined, Size: 0}, nil
	}
}

// evaluateBinaryExpression evaluates a binary operation (a + b, a - b, etc.)
func (vm *JSVM) evaluateBinaryExpression(expr *ast.BinaryExpression, scope *Scope) (Value, error) {
	// Evaluate left and right operands
	left, err := vm.evaluateExpression(expr.Left, scope)
	if err != nil {
		return Value{}, err
	}
	
	right, err := vm.evaluateExpression(expr.Right, scope)
	if err != nil {
		return Value{}, err
	}
	
	// Implement operations based on operator
	switch expr.Operator {
	case token.PLUS:
		return vm.add(left, right)
		
	case token.MINUS:
		return vm.subtract(left, right)
		
	case token.MULTIPLY:
		return vm.multiply(left, right)
		
	case token.DIVIDE:
		return vm.divide(left, right)
		
	case token.EQUALS:
		return vm.equals(left, right)
		
	case token.NOT_EQUALS:
		eq, err := vm.equals(left, right)
		if err != nil {
			return Value{}, err
		}
		return Value{Type: TypeBoolean, Data: !eq.Data.(bool), Size: 1}, nil
		
	case token.STRICT_EQUALS:
		return vm.strictEquals(left, right)
		
	case token.STRICT_NOT_EQUALS:
		eq, err := vm.strictEquals(left, right)
		if err != nil {
			return Value{}, err
		}
		return Value{Type: TypeBoolean, Data: !eq.Data.(bool), Size: 1}, nil
		
	case token.GREATER:
		return vm.compare(left, right, true)
		
	case token.LESS:
		return vm.compare(right, left, true)
		
	case token.GREATER_OR_EQUALS:
		return vm.compare(left, right, false)
		
	case token.LESS_OR_EQUALS:
		return vm.compare(right, left, false)
		
	case token.LOGICAL_AND:
		leftBool := vm.toBoolean(left)
		if !leftBool {
			return Value{Type: TypeBoolean, Data: false, Size: 1}, nil
		}
		return Value{Type: TypeBoolean, Data: vm.toBoolean(right), Size: 1}, nil
		
	case token.LOGICAL_OR:
		leftBool := vm.toBoolean(left)
		if leftBool {
			return Value{Type: TypeBoolean, Data: true, Size: 1}, nil
		}
		return Value{Type: TypeBoolean, Data: vm.toBoolean(right), Size: 1}, nil
		
	default:
		return Value{}, fmt.Errorf("unsupported binary operator: %s", expr.Operator)
	}
}

// Add math operation implementations
func (vm *JSVM) add(left, right Value) (Value, error) {
	// Handle string concatenation
	if left.Type == TypeString || right.Type == TypeString {
		leftStr := vm.toString(left)
		rightStr := vm.toString(right)
		result := leftStr + rightStr
		size := uint64(len(result))
		if !vm.allocateMemory(size) {
			return Value{}, errors.New("memory limit exceeded")
		}
		return Value{Type: TypeString, Data: result, Size: size}, nil
	}
	
	// Handle numeric addition
	leftNum := vm.toNumber(left)
	rightNum := vm.toNumber(right)
	return Value{Type: TypeNumber, Data: leftNum + rightNum, Size: 8}, nil
}

func (vm *JSVM) subtract(left, right Value) (Value, error) {
	leftNum := vm.toNumber(left)
	rightNum := vm.toNumber(right)
	return Value{Type: TypeNumber, Data: leftNum - rightNum, Size: 8}, nil
}

func (vm *JSVM) multiply(left, right Value) (Value, error) {
	leftNum := vm.toNumber(left)
	rightNum := vm.toNumber(right)
	return Value{Type: TypeNumber, Data: leftNum * rightNum, Size: 8}, nil
}

func (vm *JSVM) divide(left, right Value) (Value, error) {
	leftNum := vm.toNumber(left)
	rightNum := vm.toNumber(right)
	if rightNum == 0 {
		if leftNum == 0 {
			return Value{Type: TypeNumber, Data: math.NaN(), Size: 8}, nil
		}
		if leftNum > 0 {
			return Value{Type: TypeNumber, Data: math.Inf(1), Size: 8}, nil
		}
		return Value{Type: TypeNumber, Data: math.Inf(-1), Size: 8}, nil
	}
	return Value{Type: TypeNumber, Data: leftNum / rightNum, Size: 8}, nil
}

// Equality operations and comparisons
func (vm *JSVM) equals(left, right Value) (Value, error) {
	// Handle type conversions for loose equality
	if left.Type == right.Type {
		return vm.strictEquals(left, right)
	}
	
	// Convert to the same type first
	if (left.Type == TypeNull && right.Type == TypeUndefined) || 
	   (left.Type == TypeUndefined && right.Type == TypeNull) {
		return Value{Type: TypeBoolean, Data: true, Size: 1}, nil
	}
	
	if left.Type == TypeNumber && right.Type == TypeString {
		rightNum := vm.toNumber(right)
		return Value{Type: TypeBoolean, Data: left.Data.(float64) == rightNum, Size: 1}, nil
	}
	
	if left.Type == TypeString && right.Type == TypeNumber {
		leftNum := vm.toNumber(left)
		return Value{Type: TypeBoolean, Data: leftNum == right.Data.(float64), Size: 1}, nil
	}
	
	if left.Type == TypeBoolean || right.Type == TypeBoolean {
		leftNum := vm.toNumber(left)
		rightNum := vm.toNumber(right)
		return Value{Type: TypeBoolean, Data: leftNum == rightNum, Size: 1}, nil
	}
	
	// Default to false for other type combinations
	return Value{Type: TypeBoolean, Data: false, Size: 1}, nil
}

func (vm *JSVM) strictEquals(left, right Value) (Value, error) {
	if left.Type != right.Type {
		return Value{Type: TypeBoolean, Data: false, Size: 1}, nil
	}
	
	switch left.Type {
	case TypeUndefined, TypeNull:
		return Value{Type: TypeBoolean, Data: true, Size: 1}, nil
		
	case TypeNumber:
		leftVal := left.Data.(float64)
		rightVal := right.Data.(float64)
		
		// Handle NaN special case
		if math.IsNaN(leftVal) || math.IsNaN(rightVal) {
			return Value{Type: TypeBoolean, Data: false, Size: 1}, nil
		}
		return Value{Type: TypeBoolean, Data: leftVal == rightVal, Size: 1}, nil
		
	case TypeString:
		return Value{Type: TypeBoolean, Data: left.Data.(string) == right.Data.(string), Size: 1}, nil
		
	case TypeBoolean:
		return Value{Type: TypeBoolean, Data: left.Data.(bool) == right.Data.(bool), Size: 1}, nil
		
	case TypeObject:
		// For objects, strict equality tests identity (reference equality)
		return Value{Type: TypeBoolean, Data: left.Data == right.Data, Size: 1}, nil
		
	default:
		return Value{Type: TypeBoolean, Data: false, Size: 1}, nil
	}
}

func (vm *JSVM) compare(left, right Value, strict bool) (Value, error) {
	// Handle string comparison
	if left.Type == TypeString && right.Type == TypeString {
		leftVal := left.Data.(string)
		rightVal := right.Data.(string)
		return Value{Type: TypeBoolean, Data: leftVal < rightVal, Size: 1}, nil
	}
	
	// For everything else, convert to numbers and compare
	leftNum := vm.toNumber(left)
	rightNum := vm.toNumber(right)
	
	if math.IsNaN(leftNum) || math.IsNaN(rightNum) {
		return Value{Type: TypeBoolean, Data: false, Size: 1}, nil
	}
	
	result := leftNum < rightNum
	if !strict {
		result = result || leftNum == rightNum
	}
	
	return Value{Type: TypeBoolean, Data: result, Size: 1}, nil
}

// Type conversion helpers
func (vm *JSVM) toNumber(val Value) float64 {
	switch val.Type {
	case TypeNumber:
		return val.Data.(float64)
		
	case TypeString:
		str := val.Data.(string)
		if str == "" {
			return 0
		}
		num, err := strconv.ParseFloat(str, 64)
		if err != nil {
			return math.NaN()
		}
		return num
		
	case TypeBoolean:
		if val.Data.(bool) {
			return 1
		}
		return 0
		
	case TypeNull:
		return 0
		
	case TypeUndefined:
		return math.NaN()
		
	default:
		return math.NaN()
	}
}

func (vm *JSVM) toString(val Value) string {
	switch val.Type {
	case TypeString:
		return val.Data.(string)
		
	case TypeNumber:
		num := val.Data.(float64)
		if math.IsNaN(num) {
			return "NaN"
		}
		if math.IsInf(num, 1) {
			return "Infinity"
		}
		if math.IsInf(num, -1) {
			return "-Infinity"
		}
		if num == 0 {
			return "0"
		}
		return fmt.Sprintf("%g", num)
		
	case TypeBoolean:
		if val.Data.(bool) {
			return "true"
		}
		return "false"
		
	case TypeNull:
		return "null"
		
	case TypeUndefined:
		return "undefined"
		
	case TypeObject:
		return "[object Object]"
		
	default:
		return ""
	}
}

func (vm *JSVM) toBoolean(val Value) bool {
	switch val.Type {
	case TypeBoolean:
		return val.Data.(bool)
		
	case TypeNumber:
		num := val.Data.(float64)
		return num != 0 && !math.IsNaN(num)
		
	case TypeString:
		return val.Data.(string) != ""
		
	case TypeNull, TypeUndefined:
		return false
		
	case TypeObject:
		return true
		
	default:
		return false
	}
}

// evaluateVariableStatement processes variable declarations
func (vm *JSVM) evaluateVariableStatement(stmt *ast.VariableStatement, scope *Scope) (Value, error) {
	for _, decl := range stmt.List {
		if decl.Initializer != nil {
			// If there's an initializer, evaluate it
			val, err := vm.evaluateExpression(decl.Initializer, scope)
			if err != nil {
				return Value{}, err
			}
			
			// Store the value in the scope
			scope.Values[decl.Name] = val
		} else {
			// If no initializer, assign undefined
			scope.Values[decl.Name] = Value{Type: TypeUndefined, Size: 0}
		}
	}
	
	return Value{Type: TypeUndefined}, nil
}

// resolveIdentifier looks up an identifier in the current scope and parent scopes
func (vm *JSVM) resolveIdentifier(name string, scope *Scope) (Value, error) {
	current := scope
	for current != nil {
		if val, ok := current.Values[name]; ok {
			return val, nil
		}
		current = current.Parent
	}
	
	return Value{Type: TypeUndefined}, nil
}

// evaluateFunction creates a function value
func (vm *JSVM) evaluateFunction(fn *ast.FunctionLiteral, scope *Scope) (Value, error) {
	// Capture the scope for closures
	closureScope := scope
	
	// Create the function value
	fnValue := Value{
		Type: TypeFunction,
		Data: func(args []Value) Value {
			// Create a new scope for function execution
			fnScope := &Scope{
				Values: make(map[string]Value),
				Parent: closureScope,
			}
			
			// Bind arguments to parameter names
			for i, param := range fn.ParameterList.List {
				if i < len(args) {
					fnScope.Values[param.Name] = args[i]
				} else {
					fnScope.Values[param.Name] = Value{Type: TypeUndefined}
				}
			}
			
			// Execute function body
			result, err := vm.evaluateBlockStatement(fn.Body, fnScope)
			if err != nil {
				// In a real VM, we'd handle this better
				fmt.Printf("Function error: %v\n", err)
				return Value{Type: TypeUndefined}
			}
			
			return result
		},
		Size: 64, // Estimate function size
	}
	
	// If this is a named function, store it in its scope
	if fn.Name != nil {
		scope.Values[fn.Name.Name] = fnValue
	}
	
	// Allocate memory for function definition
	if !vm.allocateMemory(fnValue.Size) {
		return Value{}, errors.New("memory limit exceeded")
	}
	
	return fnValue, nil
}

// evaluateCallExpression evaluates a function call
func (vm *JSVM) evaluateCallExpression(call *ast.CallExpression, scope *Scope) (Value, error) {
	// Evaluate the function expression
	fnValue, err := vm.evaluateExpression(call.Callee, scope)
	if err != nil {
		return Value{}, err
	}
	
	// Check if it's a callable
	if fnValue.Type != TypeFunction {
		return Value{}, fmt.Errorf("not a function: %T", call.Callee)
	}
	
	// Evaluate each argument expression
	args := make([]Value, len(call.ArgumentList))
	for i, arg := range call.ArgumentList {
		val, err := vm.evaluateExpression(arg, scope)
		if err != nil {
			return Value{}, err
		}
		args[i] = val
	}
	
	// Call the function
	fn := fnValue.Data.(func([]Value) Value)
	result := fn(args)
	
	return result, nil
}

// evaluateIfStatement evaluates an if statement with optional else branch
func (vm *JSVM) evaluateIfStatement(stmt *ast.IfStatement, scope *Scope) (Value, error) {
	// Evaluate the condition
	condition, err := vm.evaluateExpression(stmt.Test, scope)
	if err != nil {
		return Value{}, err
	}
	
	// Convert to boolean
	conditionBool := vm.toBoolean(condition)
	
	if conditionBool {
		// Execute the consequent (then) branch
		return vm.evaluateStatement(stmt.Consequent, scope)
	} else if stmt.Alternate != nil {
		// Execute the alternate (else) branch if it exists
		return vm.evaluateStatement(stmt.Alternate, scope)
	}
	
	return Value{Type: TypeUndefined}, nil
}

// evaluateForStatement evaluates a for loop
func (vm *JSVM) evaluateForStatement(stmt *ast.ForStatement, scope *Scope) (Value, error) {
	// Create a new scope for the loop
	loopScope := &Scope{
		Values: make(map[string]Value),
		Parent: scope,
	}
	
	// Initialize the loop variable
	if stmt.Initializer != nil {
		_, err := vm.evaluateStatement(stmt.Initializer, loopScope)
		if err != nil {
			return Value{}, err
		}
	}
	
	var result Value = Value{Type: TypeUndefined}
	
	// Execute loop
	for {
		// Check loop condition if it exists
		if stmt.Test != nil {
			condition, err := vm.evaluateExpression(stmt.Test, loopScope)
			if err != nil {
				return Value{}, err
			}
			
			if !vm.toBoolean(condition) {
				break
			}
		}
		
		// Execute loop body
		val, err := vm.evaluateStatement(stmt.Body, loopScope)
		if err != nil {
			return Value{}, err
		}
		result = val
		
		// Execute the update expression if it exists
		if stmt.Update != nil {
			_, err := vm.evaluateExpression(stmt.Update, loopScope)
			if err != nil {
				return Value{}, err
			}
		}
		
		// Check resource limits
		if vm.stopped || !vm.checkTimeLimit() {
			return Value{}, errors.New("loop execution exceeded resource limits")
		}
	}
	
	return result, nil
}

// evaluateAssignExpression handles assignment operations (a = b, a += b, etc.)
func (vm *JSVM) evaluateAssignExpression(expr *ast.AssignExpression, scope *Scope) (Value, error) {
	// Get the target of the assignment
	target, ok := expr.Left.(*ast.Identifier)
	if !ok {
		return Value{}, errors.New("only identifier assignments are supported")
	}
	
	// Evaluate the right side
	rightValue, err := vm.evaluateExpression(expr.Right, scope)
	if err != nil {
		return Value{}, err
	}
	
	// Handle different assignment operators
	switch expr.Operator {
	case token.ASSIGN:
		scope.Values[target.Name] = rightValue
		return rightValue, nil
		
	case token.PLUS_ASSIGN:
		leftValue, err := vm.resolveIdentifier(target.Name, scope)
		if err != nil {
			return Value{}, err
		}
		result, err := vm.add(leftValue, rightValue)
		if err != nil {
			return Value{}, err
		}
		scope.Values[target.Name] = result
		return result, nil
		
	case token.MINUS_ASSIGN:
		leftValue, err := vm.resolveIdentifier(target.Name, scope)
		if err != nil {
			return Value{}, err
		}
		result, err := vm.subtract(leftValue, rightValue)
		if err != nil {
			return Value{}, err
		}
		scope.Values[target.Name] = result
		return result, nil
		
	default:
		return Value{}, fmt.Errorf("unsupported assignment operator: %s", expr.Operator)
	}
}

// evaluateUnaryExpression handles unary operations (like -a, !b, etc.)
func (vm *JSVM) evaluateUnaryExpression(expr *ast.UnaryExpression, scope *Scope) (Value, error) {
	operand, err := vm.evaluateExpression(expr.Operand, scope)
	if err != nil {
		return Value{}, err
	}
	
	switch expr.Operator {
	case token.NOT:
		return Value{Type: TypeBoolean, Data: !vm.toBoolean(operand), Size: 1}, nil
		
	case token.MINUS:
		num := vm.toNumber(operand)
		return Value{Type: TypeNumber, Data: -num, Size: 8}, nil
		
	case token.PLUS:
		num := vm.toNumber(operand)
		return Value{Type: TypeNumber, Data: num, Size: 8}, nil
		
	case token.TYPEOF:
		return vm.typeOf(operand), nil
		
	default:
		return Value{}, fmt.Errorf("unsupported unary operator: %s", expr.Operator)
	}
}

// typeOf implements JavaScript's typeof operator
func (vm *JSVM) typeOf(val Value) Value {
	var typeStr string
	
	switch val.Type {
	case TypeUndefined:
		typeStr = "undefined"
	case TypeNull:
		typeStr = "object" // JavaScript quirk: typeof null === "object"
	case TypeBoolean:
		typeStr = "boolean"
	case TypeNumber:
		typeStr = "number"
	case TypeString:
		typeStr = "string"
	case TypeFunction:
		typeStr = "function"
	case TypeObject:
		typeStr = "object"
	}
	
	size := uint64(len(typeStr))
	if !vm.allocateMemory(size) {
		// If we can't allocate, return a simpler string
		return Value{Type: TypeString, Data: "?", Size: 1}
	}
	
	return Value{Type: TypeString, Data: typeStr, Size: size}
}

// evaluateObjectLiteral creates a JavaScript object from an object literal
func (vm *JSVM) evaluateObjectLiteral(expr *ast.ObjectLiteral, scope *Scope) (Value, error) {
	obj := &Object{
		Properties: make(map[string]Property),
		Size:       64, // Base size for object
	}
	
	for _, prop := range expr.Value {
		// Evaluate the property value
		propValue, err := vm.evaluateExpression(prop.Value, scope)
		if err != nil {
			return Value{}, err
		}
		
		// Get property name
		var key string
		if prop.Kind == ast.PropertyKindValue {
			key = prop.Key.(*ast.StringLiteral).Value
		} else {
			return Value{}, errors.New("only simple property names are supported")
		}
		
		// Add the property
		obj.Properties[key] = Property{
			Value:       propValue,
			Enumerable:  true,
			Writable:    true,
			Configurable: true,
		}
		
		// Update object size
		obj.Size += uint64(len(key)) + propValue.Size + 16 // Estimate property overhead
	}
	
	// Allocate memory for the object
	if !vm.allocateMemory(obj.Size) {
		return Value{}, errors.New("memory limit exceeded")
	}
	
	return Value{Type: TypeObject, Data: obj, Size: obj.Size}, nil
}

// evaluateArrayLiteral creates a JavaScript array from an array literal
func (vm *JSVM) evaluateArrayLiteral(expr *ast.ArrayLiteral, scope *Scope) (Value, error) {
	// In this simple implementation, we'll represent arrays as objects with numeric keys
	obj := &Object{
		Properties: make(map[string]Property),
		Size:       64, // Base size for array object
	}
	
	// Add a length property
	obj.Properties["length"] = Property{
		Value:       Value{Type: TypeNumber, Data: float64(len(expr.Value)), Size: 8},
		Enumerable:  false,
		Writable:    true,
		Configurable: false,
	}
	
	// Add each element
	for i, element := range expr.Value {
		if element != nil {
			// Evaluate the element
			elemValue, err := vm.evaluateExpression(element, scope)
			if err != nil {
				return Value{}, err
			}
			
			// Add to the array
			key := strconv.Itoa(i)
			obj.Properties[key] = Property{
				Value:       elemValue,
				Enumerable:  true,
				Writable:    true,
				Configurable: true,
			}
			
			// Update object size
			obj.Size += elemValue.Size + 16 // Estimate property overhead
		}
	}
	
	// Allocate memory for the array
	if !vm.allocateMemory(obj.Size) {
		return Value{}, errors.New("memory limit exceeded")
	}
	
	return Value{Type: TypeObject, Data: obj, Size: obj.Size}, nil
}

func main() {
	vm := NewJSVM(1024, 1000) // 1MB memory limit, 1 second time limit
	code := `
		(function(){
			if (3.14159 > 0) {
				console.log("Hello, World.");
				return;
			}

			var xyzzy = NaN;
			console.log("Nothing happens.");
			return xyzzy;
		})();
		var output = "Hello, World.";
	`
	result, memoryUsed, err := vm.Execute(code)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Result: %v, Memory Used: %d bytes\n", result, memoryUsed)
	}
}