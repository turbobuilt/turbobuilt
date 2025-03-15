const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function log(...args) {
    // console.log(...args)
}

export class DocNodeAttribute {
    constructor({ startIndex }) {
        this.startIndex = startIndex;
    }

    name: string;
    value?: string;
    startIndex: number;
    valueStartIndex: number;
    valueParsed: boolean = false;
    style: any;

    setValue(value) {
        log("setting value", value)
        this.value = value;
        this.parseStyleIfNeeded();
    }

    parseStyleIfNeeded() {
        if (this.name === 'style') {
            let style = {};
            for (let [k, v] of this.value.split(';').map(s => s.split(':'))) {
                style[k] = v;
            }
            this.style = style

        }
    }
}

// EVERYTHING is a DocNode, even whitespace for perfect reconstruction
class DocNodeProperties {
    attributes?: DocNodeAttribute[] = []; // must be an array in case of duplicate attributes and to preserve order
    style?: any = null; // css inline styles are the only attribute that must be parsed into an object, it is set to null if there are no styles
    children?: DocNode[] = [];
    text?: string = '';
    openTagName?: string = '';
    endTagName?: string = '';
    selfClosing?: boolean = false;
    parentElement?: DocNode | null = null;
    startPos?: number;
    tagNameStartIndex?: number;
    closeTagStartIndex?: number;
    isComment?: boolean = false;
    isText?: boolean = false;
    isRoot?: boolean = false;
}
export class DocNode extends DocNodeProperties {
    constructor(data?: DocNodeProperties) {
        super();
        Object.assign(this, data);
    }

    hasAttribute?(name: string): boolean {
        return this.attributes.some(attr => attr.name === name);
    }

    set innerHTML(html: string) {
        // parse the html and replace the children
        let result = parseTemplate(html);
        // console.log("result", result)
        this.children = result.children;
    }

    // updates only named
    updateAttributes?(attributes: DocNodeAttribute[]) {
        let existingNames = new Set(this.attributes.map(attr => attr.name));
        attributes.forEach(attr => {
            if (existingNames.has(attr.name)) {
                let existingAttr = this.attributes.find(a => a.name === attr.name);
                if (existingAttr) {
                    existingAttr.setValue(attr.value);
                }
            } else {
                this.attributes.push(attr);
            }
        });
    }

    setAttributes?(attributes: {[key: string]: any}) {
        this.attributes = [];
        for (let [name, value] of Object.entries(attributes)) {
            let existingAttr = this.attributes.find(attr => attr.name === name);
            // console.log("name", name, "value", value)
            if (existingAttr) {
                // console.log("setting existing attr", existingAttr)
                existingAttr.setValue(value);
            } else {
                let attr = new DocNodeAttribute({ startIndex: null });
                attr.name = name;
                attr.setValue(value);
                this.attributes.push(attr);
            }
        }
    }

    // should be able to perfectly reconstruct the original template
    stringify?(): string {
        // Reconstruct the node as a string
        let result = '';
        if (this.isComment) {
            result += `<!--${this.text}-->`;
            return result;
        } else if (this.openTagName) {
            result += `<${this.openTagName}`;
            // serialize attributes
            this.attributes.forEach(attr => {
                log("attr is", attr)
                let value = "";
                if (attr.style) {
                    let styleString = Object.entries(attr.style)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(';');
                    if (!styleString.includes('"')) {
                        value = `"${styleString}"`;
                    } else if (!styleString.includes("'")) {
                        value = `'${styleString}'`;
                    } else {
                        value = `"${styleString.replace(/"/g, '\\"')}"`;
                    }
                } else if (attr.value !== undefined) {
                    value = `"${attr.value}"`;
                }
                if (value !== '') {
                    result += ` ${attr.name}=${value}`;
                } else {
                    result += ` ${attr.name}`;
                }
            });
            if (this.selfClosing) {
                result += ' />';
                return result;
            } else {
                result += '>';
            }
        }
        // handle text content
        if (this.text) {
            result += this.text;
        }
        // recurse for children
        this.children.forEach(child => {
            result += child.stringify();
        });
        // closing tag if not void/self-closing
        if (this.openTagName && !(this.selfClosing || VOID_ELEMENTS.has(this.openTagName.toLowerCase()))) {
            result += `</${this.openTagName}>`;
        }
        return result;
    }

    // implement an perfect xpath selector that reads /div/div[2], etc.
    getElementByXPath?(xpath: string, doc: DocNode): DocNode | null {
        // Basic XPath support e.g. /div[1]/div[2]
        let parts = xpath.split('/').filter(Boolean);
        let current: DocNode | null = doc;
        for (let part of parts) {
            let match = part.match(/^([^\[]+)(\[(\d+)\])?$/);
            if (!match || !current) return null;
            let name = match[1];
            let index = match[3] ? parseInt(match[3]) - 1 : 0;
            // filter children by tagName
            let candidates = current.children.filter(c => c.openTagName === name);
            if (index < 0 || index >= candidates.length) return null;
            current = candidates[index];
        }
        return current;
    }

    setStyle?(style: any) {
        this.style = style;
        let styleAttr = this.attributes.find(attr => attr.name === 'style');
        if (styleAttr) {
            Object.assign(styleAttr.style, style);
        } else {
            let attr = new DocNodeAttribute({ startIndex: null });
            attr.name = 'style';
            attr.style = style;
            this.attributes.push(attr);
        }
    }
}

// extend array to have "last" method
export { };
declare global {
    interface Array<T> {
        last(): T;
    }
}
Array.prototype.last = function () {
    return this[this.length - 1];
}

// this function must parse and remember an entire <template> tag for a vue sfc
// it should be extremely thorough, keeping even whitespace as "nodes"
export function parseTemplate(template: string, root?: DocNode): DocNode {
    root = root || new DocNode({ startPos: 0, isRoot: true });
    let nodes = [root];
    let state = ['text'] as ('single_quote' | 'self_closing_tag' | 'comment_exclamation' | 'comment_dash_1' | 'comment_dash_2' | 'closing_tag' | 'tag_attribute_name' | 'double_quote' | 'tag' | 'tag_open' | 'tag_name' | 'tag_attributes' | 'tag_attribute_value' | 'style' | 'text' | 'comment')[];
    for (var i = 0; i < template.length; i++) {
        let char = template[i];
        log(i, char, state[state.length - 1])
        switch (state[state.length - 1]) {
            case 'text':
                if (char === '<') {
                    if (nodes.last().isText) {
                        nodes.last().text = template.slice(nodes.last().startPos, i);
                        nodes.pop();
                    }
                    state.push('tag_open');
                    log("starting tag")
                } else if (!nodes.last().isText) {
                    let newNode = new DocNode({ startPos: i, isText: true });
                    log('starting text node')
                    nodes.last().children.push(newNode);
                    nodes.push(newNode);
                    state.push('text');
                }
                continue;
            case 'comment':
                if (char === "-" && template.slice(i, i + 3) === '-->') {
                    log("close comment", i, char, nodes.length)
                    nodes.last().text = template.slice(nodes.last().startPos, i);
                    i += 2;
                    nodes.pop();
                    state[state.length - 1] = 'text';
                }
                continue;
            case 'tag_open':
                if (template.slice(i, i + 3) === '!--') {
                    state.push('comment');
                    log("comment");
                    i += 3;
                    let newNode = new DocNode({ startPos: i, isComment: true });
                    nodes.last().children.push(newNode);
                    nodes.push(newNode);
                } else if (char === '/') {
                    state[state.length - 1] = 'closing_tag';
                    nodes.last().closeTagStartIndex = i + 1;
                    log("starting close tag");
                } else if (!char.match(/\s/)) {
                    log("starting tag name")
                    state[state.length - 1] = 'tag_name';
                    let newNode = new DocNode({ startPos: i, tagNameStartIndex: i });
                    nodes.last().children.push(newNode);
                    nodes.push(newNode);
                }
                continue;
            case 'closing_tag':
                if (char !== '>') {
                    continue;
                }
                if (nodes.last().isText) {
                    log("closing text node in </")
                    nodes.last().text = template.slice(nodes.last().startPos, i);
                    nodes.pop();
                }
                let currentTag = nodes.last();
                if (!currentTag) {
                    throw new Error('Unexpected close tag');
                }
                let closeTagName = template.slice(currentTag.closeTagStartIndex, i);
                log("closed", closeTagName)
                if (currentTag.openTagName.trim() !== closeTagName.trim()) {
                    throw new Error('Mismatched close tag \'' + closeTagName + '\' doesnt match \'' + currentTag.openTagName + '\' at ' + template.slice(i - 10, i + 10));
                }
                currentTag.endTagName = closeTagName;
                nodes.pop();
                state.pop();
                continue;
            case 'tag_name':
                if (char === '>') {
                    nodes.last().openTagName = template.slice(nodes.last().tagNameStartIndex, i);
                    log("opened", nodes.last().openTagName)
                    // check if void element
                    if (VOID_ELEMENTS.has(nodes.last().openTagName.trim().toLowerCase())) {
                        nodes.pop();
                    }
                    state[state.length - 1] = 'text';
                } else if (char.match(/\s/)) {
                    nodes.last().openTagName = template.slice(nodes.last().tagNameStartIndex, i);
                    state[state.length - 1] = 'tag_attributes';
                }
                continue;
            case 'tag_attributes':
                if (char === '>') {
                    // check if void element
                    if (VOID_ELEMENTS.has(nodes.last().openTagName.trim().toLowerCase())) {
                        nodes.pop();
                    }
                    state[state.length - 1] = 'text';
                } else if (!char.match(/\s/)) {
                    state.push('tag_attribute_name');
                    var attr = new DocNodeAttribute({ startIndex: i });
                    nodes.last().attributes.push(attr);
                } else if (char === "=" && nodes.last().attributes.length && !nodes.last().attributes.last().valueParsed) {
                    state.push('tag_attribute_value');
                    nodes.last().attributes.last().valueStartIndex = i + 1;
                    nodes.last().attributes.last().valueParsed = true;
                }
                continue;
            case 'tag_attribute_name':
                var match = template.slice(i).match(/^\s*=/);
                if (match) {
                    nodes.last().attributes.last().name = template.slice(nodes.last().attributes.last().startIndex, i);
                    state[state.length - 1] = 'tag_attribute_value';
                    nodes.last().attributes.last().valueParsed = true;
                    nodes.last().attributes.last().valueStartIndex = i + 1;
                    i += match[0].length - 1;
                } else if (char === '>') {
                    nodes.last().attributes.last().name = template.slice(nodes.last().attributes.last().startIndex, i);
                    state[state.length - 1] = 'text';
                    // if is a void element
                    if (VOID_ELEMENTS.has(nodes.last().openTagName.trim().toLowerCase())) {
                        nodes.pop();
                    }
                } else if (char.match(/\s/)) {
                    nodes.last().attributes.last().name = template.slice(nodes.last().attributes.last().startIndex, i);
                    state[state.length - 1] = 'tag_attributes';
                } else if (char === "/") {
                    state[state.length - 1] = 'self_closing_tag';
                    nodes.last().selfClosing = true;
                }
                continue;
            case 'self_closing_tag':
                if (char === '>') {
                    state[state.length - 1] = 'text';
                    nodes.pop();
                } else if (char.match(/\s/)) {

                } else {
                    throw new Error('Unexpected character \'' + char + '\' in self closing tag' + template.slice(i - 10, i + 10));
                }
                continue;
            case 'tag_attribute_value':
                var match = template.slice(i).match(/^\s*["']/);
                if (match) {
                    nodes.last().attributes.last().valueStartIndex = i + match[0].length - 1
                    if (match[0][match[0].length - 1] === '"')
                        state.push('double_quote');
                    else
                        state.push('single_quote');
                    i += match[0].length - 1;
                } else if (char.match(/\s/)) {
                    state[state.length - 1] = 'tag_attributes';
                } else if (char === '>') {
                    // check void
                    if (VOID_ELEMENTS.has(nodes.last().openTagName.trim().toLowerCase())) {
                        nodes.pop();
                    }
                    state[state.length - 1] = 'text';
                } else if (char === "/") {
                    state[state.length - 1] = 'self_closing_tag';
                    nodes.last().selfClosing = true;
                }
                continue;
            case 'single_quote':
                if (char === "'" && template[i - 1] !== '\\') {
                    if (state.at(-2) === 'tag_attribute_value') {
                        nodes.last().attributes.last().setValue(template.slice(nodes.last().attributes.last().valueStartIndex + 1, i - 1));
                        state[state.length - 1] = 'tag_attributes';
                    } else {
                        throw new Error('Unexpected single quote ' + template.slice(i - 10, i + 10));
                    }
                }
                continue;
            case 'double_quote':
                if (char === '"' && template[i - 1] !== '\\') {
                    log("double quote", i, char, nodes.length)
                    if (state.at(-2) === 'tag_attribute_value') {
                        log("will set value", template.slice(nodes.last().attributes.last().valueStartIndex + 1, i))
                        nodes.last().attributes.last().setValue(template.slice(nodes.last().attributes.last().valueStartIndex + 1, i));
                        state[state.length - 1] = 'tag_attributes';
                    } else {
                        throw new Error('Unexpected double quote ' + template.slice(i - 10, i + 10));
                    }
                }
                continue;
        }
        log("DID LOOP");
    }
    // close text
    if (state[state.length - 1] === 'text' && nodes.last().isText) {
        nodes.last().text = template.slice(nodes.last().startPos, template.length);
        nodes.pop();
    }
    log("DoIN parsing")
    return root;
}

let parsed = parseTemplate(`<template>
  <div class="organic-intel-ai">
    <div class="hero">
      <div class="overlay">
        <img class="hero-bg" src="[IMAGE short-description='inspirational nature background']A panoramic view of a serene organic landscape blending modern technology with nature, with a beautiful sunrise and soft mist, artistic style, high resolution" alt="Hero Background"/>
        <div class="content">
            <h1>gggg Intel AI</h1>
            <img width="100" height="100" src="bob" style="background: red"/>
            <p> Developed by veterans, ddddd to rejuvenating lives through innovative technology. In a world filled with tech, we believe true happiness comes from tools that make you feel better. Our mission lll is to apply the secrets of AI to your everyday life in a way that lifts your spirit. </p>
            <button class="cta-button">Learn More</button>
            <div style="width: 100px; height: 100px; background: blue; background-image: url('f')">undefined</div>
        </div>
      </div>
    </div>
    <section class="features">
      <div v-for="item of 10">cccccccc</div>
    </section>
  </div>
</template>`);
let image = parsed.getElementByXPath('/template/div/div/div/img', parsed);
image.setAttributes({ src: "test... src" })
console.log(parsed.stringify());