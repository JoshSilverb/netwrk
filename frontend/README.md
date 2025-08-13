Figure out how to get tailwind to compile for web:
https://www.nativewind.dev/quick-starts/expo

Next step is:
Look through the repo here to figure out how to get tailwind to compile for web:
https://github.com/nativewind/nativewind/blob/next/examples/expo/package.json

Run the app server with 
npm run start:wsl
(although it looks like it works with just plain `expo start` too)

Worked through this to get expo go working:
https://github.com/expo/fyi/blob/main/wsl.md
^it might make the emulator work too


Use something like https://nativebase.io/ for the buttons and stuff because it's hard to make from scratch with css

Use yarn not npm for package management
Use https://github.com/mrzachnugent/react-native-reusables for UI components
    -> it's like this https://ui.shadcn.com/ but for react native

^Actually using tamagui instead

Cards must become:
|------------------------------|
| Avatar  NAME                 |
| Avatar  location   DROPDOWN  |  --> dropdown exposes user bio and "more" button
|                              |
|------------------------------|

Have "bio" and "Notes" section, but only bio is indexed by the model
Don't have IG and Twitter as defaults for social medias - linkedin is most important
Add "job" field to contact profile
Figure out deduplication of locations on the map
Add ability to delete contacts


AWS stuff:
API Gateway --> Lambda --> RDS proxy service --> RDS Postgres
Second half outlined here: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-lambda-tutorial.html

Roadmap: https://docs.google.com/document/d/129XY5eGY0OtNrhff0Q25pRoaJYyOTsoRrSlGZluzJbk/edit