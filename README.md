# ts-vote-frame
Typescript frame service for Farcaster

Development
===========

```bash
pnpm i
pnpm dev
```

Saldy the HMR does not work when using frog with node.js, so you'll have to stop and start the server between changes, manually (even tho the console will say "page reload").

Usage
=====

Main endpoint is `/image` which generates images based on the parameters received.

Receives either POST or GET requests. For GET requests, plural (array) parameters, should be defined in singular form, as many times as required (i.e. `&choice=Choice1&choice=Choice2`).

It requires a `type` parameter, which can be `question`, `results`, `info` or `error`.

The other parameters depend on the type:

`error`
-------

Expects a `error` property with the error message.

```bash
curl -X POST -H "Content-Type: application/json" -d '{
	"type": "error",
	"error": "Invalid process id"
}' "http://localhost:5173/image"
```

![error](https://img.frame.vote/image?type=error&error=Invalid%20process%20id)

`info`
------

Expects an `info` property of type `[]string`, which will be displayed as a list:

```bash
curl -X POST -H "Content-Type: application/json" -d '{
	"info": "info",
	"info": [
    "first line",
    "second line",
    "third line",
    "etc line"
  ]
}' "http://localhost:5173/image"
```

![info](https://img.frame.vote/image?type=info&info=first%20line&info=second%20line&info=third%20line&info=etc%20line)

`question`
----------

Expects `question` (`string`) and `choices` (`[]string`):

```bash
curl -X POST -H "Content-Type: application/json" -d '{
	"type": "question",
	"question": "How do you like kiwi?",
	"choices": [
		"Skin ON",
		"Skin OFF",
		"Dafuq, Kiwi???"
	]
}' "http://localhost:5173/image"
```

![info](http://img.frame.vote/image?type=question&question=How%20do%20you%20like%20kiwi??&choice=Skin%20ON&choice=Skin%20OFF&choice=Dafuq,%20Kiwi???)


`results`
---------

Expects everything from `question` + `results` (`[]string`), `voteCount` (`number`) and `maxCensusSize` (`number`):

```bash
curl -X POST -H "Content-Type: application/json" -d '{
	"type": "results",
	"question": "How do you like kiwi?",
	"choices": [
		"Skin ON",
		"Skin OFF",
		"Dafuq, Kiwi???"
	],
	"results": ["8", "3", "9"],
	"voteCount": 10,
	"maxCensusSize": 100
}' "http://localhost:5173/image"
```

![results](https://img.frame.vote/image?type=results&question=How%20do%20you%20like%20kiwi?&choice=Skin%20ON&choice=Skin%20OFF&choice=Dafuq,%20Kiwi???&result=8&result=3&result=9&voteCount=10&maxCensusSize=100)

Head to http://localhost:5173
