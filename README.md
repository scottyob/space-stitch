# Space Stitch

This is a really simple app to keep track of Crochet stitching.



# Features
- **Local Data**: Every data is stored in the window LocalStorage.  Nothing ever leaves your web browser.
- **Settings**: Move forward/back by stitch, group, or round.

## Supported Stitches
See *parse.js* for the **InstructionOperator**.
- It uses Chevrotain.io library for parsing
- You can copy/paste app/parse.js into https://chevrotain.io/playground/

## Developing
- This Nextjs 13/14 app is an excuse to play with the App router.
- Just 'npm install && npm run dev' to build upon it.

## Running Tests

```bash
npm test
```

## Building (docker image)
```
sudo docker build -t scottyob/space-stitch .
sudo docker push scottyob/space-stitch:latest
```

