# magicmath.xyz

This is an open source application for symbolic mathematic, the app aims to be intuitive, easy to use, and be multi-cultural.

You can use the app on https://marcos30004347.github.io/mathemagic/

## Multicultural
Users are able to use any supported language to make math querys inside the app, the default language will be whatever language is defined on the browser but the user can switch to any language registered on the app. This makes the app a good fit for young students that does not lives on a country that speaks english nativelly or at least does not feel confortable with the language yet.

### Adding new languages
Under the /public/api folder is possible to find json files that defines apis for different languages, currently there are little suport for english and brazilean portuguese.

The api json file looks something like:
```json
{
	"querys": [
		{
			"query": "example query {0: expression}",
			"brief": "small description of what the query do",
			"exec": "the interpreter function that should be invoked",
			"example": "example query 3x + 4y + 4"
			"output": "The result of the query on {0} is {output}"
		},
		...
	]
}
```

the querys array describe all querys that can be make to the api.

The fields are:
- query: describe how the query should be formed, in the example case the user will be able to type "example query 3x + 4" for instance, the '{ 0: expr }' describes that an input should occur at that position and that this input is of index '0' (the index is used internaly by the interpreter) and of type 'expression '

- brief: A brief description of what the query does, this is used to generate documentation for the query.

- exec: The function that should be executed internally by the interpreter, like 'reduction', 'plot', 'expansion'. For now there is no good documentation on those sinse the app is heavelly on develoment, for more information refer to the source at ./src/lib/interpreter.tsx or to other language api json files at ./public/api/.

- "example": A simple query that will be used to generate the examples at the documentation tab.

- "output": The output template, this will be what will show up on the screen when the query is resolved, the '{0}' means that the input of index '0' should be placed at that location, and '{output}' means that the output of the interpreter should be placed at that location.

## Tech
The application is built using ReactJS(https://reactjs.org/) and Gauss(https://marcos30004347.github.io/gauss/), a symbolic math library written in C++ and ported to JavaScript using WebAssembly what gives the app a lot of speed on the browser for the heavy math manipulation.
