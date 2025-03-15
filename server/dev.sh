# set node env dev
export NODE_ENV=development
kill -9 $(lsof -t -i :8081)   
(npx nodemon -e 'ts,json' --watch 'src/**/*.ts' --ignore 'src/migrations.ts' --exec 'tsx src/main.ts') & (bunx nodemon --watch 'src/methods/**/*.ts' -e ts --exec 'bun copyData.ts')
wait

