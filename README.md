# TVDML

This is library that main goal is to greatly simplify app development for Apple TV using pure Javascript and [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) providing tools to solve problems like:

- Routing
- Templating and updating data
- Event binding
- Detecting "Menu" button presses
- Configuring player for seamless playing

## Routing

tvOS provided great foundation to write apps using [TVML](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/index.html) and [TVJS](https://developer.apple.com/reference/tvmljs). But you need somehow to react on user's activity and map it on application views. 

To help you solving this issues TVDML provides navigation module.

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('start'));

TVDML
	.handleRoute('start')
	.pipe(TVDML.render(
		<document>
			<alertTemplate>
				<title>This is initial view</title>
				<description>You can now navigate to another view</description>
				<button onSelect={event => TVDML.navigate('next')}>
					<text>Go to next page</text>
				</button>
			</alertTemplate>
		</document>
	));

TVDML
	.handleRoute('next')
	.pipe(TVDML.render(
		<document>
			<alertTemplate>
				<title>This is next view</title>
				<description>Now you know how to use routes!</description>
			</alertTemplate>
		</document>
	));
```

> This is small example of using navigation and rendering modules to handle routes and present views to user.

Here is complete navigation module's api:

- `TVDML.handleRoute(routeName)` — Creates pipeline for route handling. Only one pipeline can be created for the route. Otherwise it will throw error.

- `TVDML.dismissRoute(routeName)` — Destroy previously created route pipeline. Can destroy only created pipelines. Otherwise it will throw error.

- `TVDML.navigate(routeName[, params][, isRedirect])` — Navigation trigger. Will invoke registered route pipeline with passed params if they are specified. Route pipeline will result in creating new navigation document. if param `isRedirect` is passed then route pipeline will replace current navigation document with new one.

- `TVDML.redirect(routeName[, params])` — Same as `TVDML.navigate(routeName, params, true)`.

```javascript
import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('start', {foo: 'bar'}));

// To create route handler use `handleRoute` method.
TVDML
	.handleRoute('start')
	.pipe(payload => {
		const {
			route,
			redirect,
			navigation,
		} = payload;
		
		console.log(route); // 'start'
		console.log(redirect); // false
		console.log(navigation); // {foo: 'bar'}
	});
	
// `dismissRoute` method will help you destroy route handler.
TVDML.dismissRoute('start');
```

Here is a list of predefined constants for system events:

- `TVDML.event.EXIT`
- `TVDML.event.ERROR`
- `TVDML.event.LAUNCH`
- `TVDML.event.RELOAD`
- `TVDML.event.RESUME`
- `TVDML.event.SUSPEND`

> This events are related to system handlers: `App.onLaunch`, `App.onExit` etc. 

Why you should use this events and not system handler directly? Because handlers can be assigned only once and events can be attached multiple times. But no one force you to use them.

You can add event listeners like this:

```javascript
import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(eventSymbol => console.log('App is launched!'));
	
const suspendEventPipeline = TVDML
	.subscribe(TVDML.event.SUSPEND)
	.pipe(eventSymbol => console.log('App is sent to background'));

// To destroy event pipeline use `unsubscribe` method.
suspendEventPipeline.unsubscribe();
```

> To know more about how pipelines works check section "Pipelines".

Also there are some predefined routes that may help you:

- `TVDML.route.NOT_FOUND` — Will be invoked when navigation module was unable to find match to requested route.

The next big thing is...

## Templating

