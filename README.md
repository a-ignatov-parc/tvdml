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
					<text>Let's go!</text>
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

