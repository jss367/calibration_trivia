## Deployment

firebase deploy

## Build locally

`nvm use 20` <---- You must use this

`npm install`

`npm run build`

`npm start`

# Bug fix

Go to /Users/juliussimonelli/git/calibration_trivia/node_modules/superstatic/lib/providers/fs.js

replace

            return {
                modified: stat.mtime.getTime(),
                size: stat.size,
                etag: await fetchEtag(stat.pathname, stat),
                stream: fs.createReadStream(stat.pathname),
            };

with

// Around line 89, replace the existing return statement with:
   return {
       modified: stat.mtime ? stat.mtime.getTime() : Date.now(),
       size: stat.size || 0,
       etag: await fetchEtag(stat.pathname, stat),
       stream: fs.createReadStream(stat.pathname),
   };
