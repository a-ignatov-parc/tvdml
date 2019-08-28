# TVDML

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [New!](#new)
  - [Update highlights](#update-highlights)
  - [Migration guide](#migration-guide)
- [Intro](#intro)
- [System Requirements](#system-requirements)
- [Getting started](#getting-started)
- [Routing](#routing)
- [Using React.js](#using-reactjs)
  - [Rendering to player's documents](#rendering-to-players-documents)
  - [Modals](#modals)
  - [Working with `menuBar`](#working-with-menubar)
  - [Styling elements](#styling-elements)
  - [Events](#events)
  - [Working with `DataItem`](#working-with-dataitem)
  - [Complete rendering api](#complete-rendering-api)
- [Pipelines and Streams](#pipelines-and-streams)
  - [Streams](#streams)
    - [Streams' public api](#streams-public-api)
  - [Pipelines](#pipelines)
    - [Pipelines' public api](#pipelines-public-api)
  - [Rules of combining streams and pipelines](#rules-of-combining-streams-and-pipelines)
- [Additional tools](#additional-tools)
  - [Detecting Menu button press](#detecting-menu-button-press)
- [Sample code](#sample-code)
- [Useful Links](#useful-links)
- [Contributions](#contributions)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## New

This is the new version of tvdml, `6.X`.

### Update highlights

- Switched TVML renderer to React.js (**Breaking**).
- Unified different ways to create TVML documents (**Breaking**).
- Simpler syntax to create stylesheets using `<style>` element (**Breaking**).
- Improved Menu button detection.
- Changed `TVDML.renderModal()` rerendering behavior (**Breaking**).

### Migration guide

Check out [migration guide from `5.X`](docs/MIGRATION_5.md).

For the older version of tvdml, refer to the [`5.X` branch](https://github.com/a-ignatov-parc/tvdml/tree/v5.1.1).

## Intro

This is a library that's the main goal is to greatly simplify app development for Apple TV using [React.js](https://reactjs.org/) and provide tools to solve problems like:

- React.js integration with TVML and TVJS.
- Routing.
- Event binding.
- "Menu" button detection.

## System Requirements

Starting from `4.X` TVDML drops support for tvOS < 10. If you need that support please consider using [`3.X`](https://github.com/a-ignatov-parc/tvdml/tree/v3.0.4).

## Getting started

TVDML is shipping as [npm package](https://www.npmjs.com/package/tvdml) and can be installed with npm or `yarn`. In addition you'll need to install React.js.

```sh
npm install --save tvdml react
```

Or using `yarn`

```sh
yarn add tvdml react
```

TVDML is written in ES6 and built using UMD wrapper so it can be used in any environment with any of this ways:

```js
// Directly from global scope.
App.onLaunch = function() {
  console.log(TVDML);
}

// Or with CommonJS if you are using bundlers like browserify.
var TVDML = require('tvdml');

// Or with ES6 imports.
import * as TVDML from 'tvdml';

// You can use ES6 destructuring if you need only few
// of the provided features.
import { subscribe, handleRoute, navigate } from 'tvdml';

// Or even require modules from their sources.
import { handleRoute, navigate } from 'tvdml/src/navigation';
```

> Requiring modules from their sources can help you decrease app size if you are using [rollup](http://rollupjs.org/) for your builds.

Despite being written totally in ES6 TVDML is not forcing you to use it.

But you should agree that this...

```js
App.onLaunch = function(options) {
  evaluateScripts([
    options.BASEURL + 'libs/tvdml.js',
    options.BASEURL + 'libs/react.js',
  ], function(success) {
    if (success) {
      TVDML
        .render(function(payload) {
          return React.createElement(
            'document',
            null,
            React.createElement(
              'alertTemplate',
              null,
              React.createElement(
                'title',
                null,
                'Hello world'
              )
            )
          );
        })
        .sink();
    }
  });
}
```

Doesn't look as nice as this

```js
import React from 'react';
import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(TVDML.render(payload => (
    <document>
      <alertTemplate>
        <title>Hello world</title>
      </alertTemplate>
    </document>
  )));
```

So what we need to be able to write code as in second example? Well it's not that simple but this [tvdml-boilerplate](https://github.com/a-ignatov-parc/tvdml-app-boilerplate) repo will shed the light on basic build configuration.

Well! Now we know how to write apps using ES6 and JSX so let's start from the basic features!

## Routing

tvOS provided great foundation to write apps using [TVML](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/index.html) and [TVJS](https://developer.apple.com/reference/tvmljs). But you need somehow to react on user's activity and map it to the UI.

To help you solve this issues TVDML provides navigation module.

```js
import React from 'react';
import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(() => TVDML.navigate('start'));

TVDML
  .handleRoute('start')
  .pipe(TVDML.render(() => (
    <document>
      <alertTemplate>
        <title>This is initial view</title>
        <description>You can now navigate to another view</description>
        <button onSelect={event => TVDML.navigate('next')}>
          <text>Go to next page</text>
        </button>
      </alertTemplate>
    </document>
  )));

TVDML
  .handleRoute('next')
  .pipe(TVDML.render(() => (
    <document>
      <alertTemplate>
        <title>This is next view</title>
        <description>Now you know how to use routes!</description>
      </alertTemplate>
    </document>
  )));
```

> This is a small example of navigation and rendering modules usage which helps handle routes and show views to the user.

Here is a complete navigation module api:

- `TVDML.handleRoute(routeName)` — Creates pipeline for route handling. Only one pipeline can be created for the route. Otherwise it will throw error.

- `TVDML.dismissRoute(routeName)` — Destroy previously created route pipeline. Can destroy only created pipelines. Otherwise it will throw error.

- `TVDML.navigate(routeName[, params][, isRedirect])` — Navigation trigger. Will invoke registered route pipeline with passed params if they are specified. Route pipeline will result in creating new navigation document. if param `isRedirect` is passed then route pipeline will replace current navigation document with new one.

- `TVDML.redirect(routeName[, params])` — Same as `TVDML.navigate(routeName, params, true)`.

```js
import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(() => TVDML.navigate('start', { foo: 'bar' }));

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
    console.log(navigation); // { foo: 'bar' }
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

Why would you use this events and not system handlers directly? Handlers can be assigned only once and events can be attached multiple times. But no one force you to use them.

You can add event listeners like this:

```js
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

> To know more about how pipelines works check [Pipelines](#pipelines) section.

Also there are some predefined routes that may help you:

- `TVDML.route.NOT_FOUND` — Will be invoked when navigation module was unable to find match to requested route.

The next big thing is...

## Using React.js

With TVDML your main way to create documents will be React.js.

> Here is a [list of all available documents](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/TextboxTemplate.html) in TVML.

To render any react component you need to provide rendering factory to `TVDML.render` pipeline.

Pipeline's payload will be passed as the first argument to rendering factory so you'll be able to map it's props to rendering tree.

```js
import React from 'react';
import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(TVDML.render(payload => (
    <document>
      <alertTemplate>
        <title>Hello world</title>
      </alertTemplate>
    </document>
  )));
```

Here is how to render any component you like:

```js
import React from 'react';
import PropTypes from 'prop-types';
import * as TVDML from 'tvdml';

function Hello(props) {
  return (
    <document>
      <alertTemplate>
        <title>Hello {props.name}</title>
      </alertTemplate>
    </document>
  );
}

Hello.propTypes = {
  name: PropTypes.string,
};

Hello.defaultProps = {
  name: 'world',
};

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(TVDML.render(payload => (
    <Hello name="user" />
  )));
```

It's just plain old React.js.

But there are some things you need to remember about TVML and React.js.

Because TVML and TVJS are not your normal browser they have some limitations. And to be able to work with them as best as possible react's tvml renderer have some quirks:

1. Attribute names should be written in props as they are written in [docs](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/TVJSAttributes.html). There is no `className` to set `class` attribute.
1. Events are normal DOM events provided by TVML.

Everythin else should be as you expected.

### Rendering to player's documents

`player.overlayDocument` and `player.interactiveOverlayDocument` are not default targets for rendering components but there are two ways to do this:

1. Sink empty document to `TVDML.render()`:

    ```js
    const document = TVDML.createEmptyDocument();

    const pipeline = TVDML.render(() => (
      <document>
        <alertTemplate>
          <title>Hello</title>
        </alertTemplate>
      </document>
    ));

    pipeline.sink({ document }).then(() => {
      player.interactiveOverlayDocument = document;
    });
    ```

1. Use TVML renderer directly

    ```js
    const document = TVDML.createEmptyDocument();

    TVDML.ReactTVML.render((
      <document>
        <alertTemplate>
          <title>Hello</title>
        </alertTemplate>
      </document>
    ), document, () => {
      player.interactiveOverlayDocument = document;
    });
    ```

Just don't forget to unmount components when you clear player's documents or you may face memory leaks and many other issues.

You can unmount component by passing previously rendered document to `TVDML.ReactTVML.unmountComponentAtNode(document)`.

### Modals

Modals are perfect when you need to show some useful information but don't want to interupt opened view context. You can use `TVDML.renderModal()` method to render any document you want in overlay. `TVDML.renderModal()` behaviour is similar to `TVDML.render()`.

There is also `TVDML.removeModal()` method that removes any presented modal document. Or `TVDML.dismissModal()` to compose modal dismissal with other operations.

```js
import React from 'react';
import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(() => TVDML.navigate('start'));

TVDML
  .handleRoute('start')
  .pipe(downloadTVShows())
  .pipe(TVDML.render(payload => (
    <document>
      <stackTemplate>
        <banner>
          <title>TV Shows</title>
        </banner>
        <collectionList>
          <grid>
            {payload.tvshows.map(tvshow => {
              return (
                <lockup onSelect={showTVShowDescription.bind(this, tvshow)}>
                  <img src={tvshow.cover} width="250" height="250" />
                  <title>{tvshow.title}</title>
                </lockup>
              );
            })}
          </grid>
        </collectionList>
      </stackTemplate>
    </document>
  )));

function showTVShowDescription(tvshow) {
  // Creating modal document rendering pipeline.
  const pipeline = TVDML.renderModal(() => (
    <document>
      <descriptiveAlertTemplate>
        <title>{tvshow.title}</title>
        <description>{tvshow.description}</description>
      </descriptiveAlertTemplate>
    </document>
  ));

  // Invoking created pipeline.
  pipeline.sink();
}
```

Every next invocation of `TVDML.renderModal()` will rerender active modal without closing it.

If you need to close and then open modal again use `TVDML.dismissModal()` pipeline.

```js
TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(TVDML.renderModal(() => (
    <document>
      <descriptiveAlertTemplate>
        <title>Modal #1</title>
      </descriptiveAlertTemplate>
    </document>
  )))
  .pipe(TVDML.dismissModal())
  .pipe(TVDML.renderModal(() => (
    <document>
      <descriptiveAlertTemplate>
        <title>Modal #2</title>
      </descriptiveAlertTemplate>
    </document>
  )));
```

### Working with `menuBar`

One of the trickiest things in TVML is configure and use [menu bar](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/MenuBarTemplate.html) across multiple views.

TVDML provides easy to use solution for this issue.

```js
import React from 'react';
import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(TVDML.render(() => (
    <document>
      <menuBarTemplate>
        <menuBar>
          <menuItem route="search">
            <title>Search</title>
          </menuItem>
          <menuItem route="my" autoHighlight>
            <title>My</title>
          </menuItem>
          <menuItem route="all">
            <title>TV Shows</title>
          </menuItem>
          <menuItem route="settings">
            <title>Settings</title>
          </menuItem>
        </menuBar>
      </menuBarTemplate>
    </document>
  )));

TVDML
  .handleRoute('my')
  .pipe(...);

TVDML
  .handleRoute('all')
  .pipe(...);

TVDML
  .handleRoute('search')
  .pipe(...);

TVDML
  .handleRoute('settings')
  .pipe(...);
```

Views switching will be handled by TVDML. All you have to do is to create `menuItem` elements with defined `route` attribute which must point to defined routes.

> If you want to select specific menu item use `autoHighlight` attribute for this purpose.

### Styling elements

There are two ways to style elements:

1. Using `style` prop to write inline styles. `style` prop is key-value dictionary. Keys are style names written in camelCase.
1. Using `<style>` element to define stylesheets  + `class` prop to bind them to elements.

```js
import React from 'react';
import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(TVDML.render(payload => (
    <document>
      <head>
        <style>{`
          .title {
            tv-text-style: title1;
          }
        `}</style>
      </head>
      <alertTemplate>
        <title class="title">Hello user</title>
        <description style={{ tvTextStyle: 'title2' }}>
          Nice to see you
        </description>
      </alertTemplate>
    </document>
  )));
```

All available styles can be found here: [TVML Styles](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/ITMLStyles.html).

### Events

Here is everything as in React.js except that all events are native TVML events.

List of controllable elements:

- `button`
- `lockup`
- `listItemLockup`

List of available handlers:

- `onPlay` — Triggers when "Play" button is pressed.
- `onSelect` — Triggers when Touchpad is pressed.
- `onChange` — Triggers when element change its value. `<ratingBadge />` for example.
- `onHighlight` — Triggers when element becoming highlighted.
- `onHoldselect` — Triggers when Touchpad is pressed with a long press.
- `onNeedsmore` — Triggers when user approaches end of the list by scrolling.

```js
<button onSelect={event => console.log(event.target)}>
  <text>Press Me</text>
</button>
```

### Working with `DataItem`

In tvOS 11 [`DataItem`](https://developer.apple.com/documentation/tvmljs/dataitem) binding api was presented to fix performance issues with large documents that may ended up with very long parsing and rendering.

Here is a [short example](https://developer.apple.com/library/content/documentation/TVMLKitJS/Conceptual/TVMLProgrammingGuide/GeneratingContentForYourApp.html) how Apple suggests to use it.

So now you may wondering how we can use this cool feature in JSX?

We got you covered! Here is an updated example from "[Requesting and rendering data](#requesting-and-rendering-data)" section:

```js
const tvshows = [
  {
    title: 'Arrow, Season 1',
    url: 'http://is2.mzstatic.com/image/thumb/Music6/v4/e9/bb/9b/e9bb9bbb-16c0-d946-063d-15632dd78a76/source/600x600bb.jpg',
  },
  {
    title: 'Arrow, Season 2',
    url: 'http://is1.mzstatic.com/image/thumb/Music3/v4/bb/87/84/bb8784ca-7e31-0cc1-b56d-9243624863d3/source/600x600bb.jpg',
  },
  {
    title: 'Arrow, Season 3',
    url: 'http://is2.mzstatic.com/image/thumb/Video62/v4/ec/ca/78/ecca78a3-5bb0-0b32-954c-f7fd966582ab/source/600x600bb.jpg',
  },
];

TVDML
  .handleRoute('start')
  .pipe(TVDML.render(() => (
    <document>
      <stackTemplate>
        <banner>
          <title>TV Shows</title>
        </banner>
        <collectionList>
          <shelf>
            <prototypes>
              <lockup prototype="tvshow">
                <img
                  binding="@src:{url};"
                  width="300"
                  height="300"
                />
                <title binding="textContent:{title};" />
              </lockup>
            </prototypes>
            <section
              binding="items:{tvshows};"
              onSelect={event => console.log(event.target.dataItem)}
              dataItem={{
                tvshows: mockData.map((cover, i) => {
                  const item = new DataItem('tvshow', i);

                  item.url = cover.url;
                  item.title = cover.title;

                  return item;
                }),
              }}
            />
          </shelf>
        </collectionList>
      </stackTemplate>
    </document>
  )));
```

The key difference from the example provided by Apple is `dataItem` attribute. It's responsible to apply `DataItems` to final document and this:

```js
<section
  binding="items:{tvshows}"
  dataItem={{
    tvshows: tvshows.map(tvshow => {
      const item = new DataItem('tvshow', i);

      item.url = cover.url;
      item.title = cover.title;

      return item;
    }),
  }}
/>
```

Is same as:

```js
<section binding="items:{tvshows}" />

function parseJson(information) {
  const results = JSON.parse(information);

  const parsedTemplate = templateDocument();

  navigationDocument.pushDocument(parsedTemplate);

  const shelf = parsedTemplate.getElementsByTagName('shelf').item(0);
  const section = shelf.getElementsByTagName('section').item(0);

  section.dataItem = new DataItem();

  const newItems = results.map((result) => {
      const objectItem = new DataItem(result.type, result.ID);
      objectItem.cover = result.cover;
      objectItem.title = result.title;
      return objectItem;
  });

  section.dataItem.setPropertyPath('tvshows', newItems);
}
```

### Complete rendering api

- `TVDML.render(renderFactory)` — Main rendering pipeline for React.js components. Responsible for rendering new document to `navigationDocument` or update previously rendered documents passed through pipeline.

- `TVDML.renderModal(renderFactory)` — Same as `TVDML.render()` but for modals.

- `TVDML.dismissModal()` — Pipeline that removes active modal with ability to track progress.

- `TVDML.removeModal()` — Utility over `TVDML.dismissModal()`. Use it when you don't need to track modal dismissal and don't want to invoke pipeline manually.

- `TVDML.ReactTVML` — Publicly exposed React.js' reconciler for TVML. May be useful for advanced usage. It contains next methods:

  - `render(element, container, callback)` — Mount React.js element to container (usualy TVML document).
  - `unmountComponentAtNode(container)` — Unmount active React.js components at container and clears markup.

- `TVDML.createEmptyDocument()` — Method to create empty TVML document. May be useful when using `TVDML.ReactTVML` directly. It does same as:

    ```jsx
    DOMImplementationRegistry.getDOMImplementation().createDocument();
    ```

## Pipelines and Streams

To be able to easily manage your data flows TVDML provides two additional utils. They are **Streams** and **Pipelines**. They have similar api but a little different behaviours. All core functionality in TVDML is based upon them.

### Streams

Streams can be created using `TVDML.createStream()` factory and can be described as event bus with ability to combine transforms and create forks. Here is an example:

```js
const head = TVDML.createStream();

head.pipe(value => console.log(value));
head.pipe(value => console.log(value));

head.sink(1);
```

Console:

```js
1
1
```

This code will be resulted with two records in the console because we create two forks of the main stream and all of them will receive sinked value.

Every `pipe` creates another stream that can be used separately:

```js
const head = TVDML.createStream();
const tail = head.pipe(value => log(value + 1));

tail.pipe(value => log(value * 3));

head.sink(1);
tail.sink(1);

function log(value) {
  console.log(value);
  return value;
}
```

Console:

```js
2 // ┬── 1 + 1
3 // │ ─── 1 * 3
6 // └── 2 * 3
```

As you can see `2` and `6` were produced by sinking `1` to `head` stream and `3` were produced by sinking `1` to `tail` stream. `3` is placed between `2` and `6` because of using promises to resolve pipes.

> Promises execution scheduled after current event loop.

Streams can be combined:

```js
const head1 = TVDML.createStream();
const head2 = TVDML.createStream();

head1
  .pipe(value => log(value + 1))
  .pipe(head2)
  .pipe(value => log(value + 2))

head2
  .pipe(value => log(value + 3))
  .pipe(value => log(value + 4))

head1.sink(1);

function log(value) {
  console.log(value);
  return value;
}
```

Console:

```js
2 // ┬─┬ 1 + 1
5 // │ ├── 2 + 3
9 // │ └── 5 + 4
4 // └── 2 + 2
```

Pipe transformations supports promised operations:

```js
const head = TVDML.createPipeline();

head
  .pipe(value => {
    return new Promise(resolve => {
      setTimeout(() => resolve(log(value + 1)), 100);
    });
  })
  .pipe(value => log(value + 2))
  .sink(1);

function log(value) {
  console.log(value);
  return value;
}
```

Console:

```js
2 // (100ms)
4
```

#### Streams' public api

- `pipe(handler)` — Fork parent stream and apply transform provided by `handler` function. `handler` can be function or other stream.

- `sink(value)` — Emit passed value to stream and all of its forks. Returns promise that will be resolved when all branches will process sinked value.

### Pipelines

Pipelines are streams too. But instead sinking values from the starting point of the stream you create processing pipeline with transformations and sink values from its end. Only requested brunch will be executed. Other forks stays untouched.

Let's compare with streams' first example:

```js
const head = TVDML.createPipeline();

head.pipe(value => console.log(value));
head
  .pipe(value => console.log(value))
  .sink(1);
```

Console:

```js
1
```

As we can see only sinked branch were exected.

Let's compare other examples:

```js
const head = TVDML.createPipeline();
const tail = head.pipe(value => log(value + 1));

tail.sink(1);
tail
  .pipe(value => log(value * 3))
  .sink(1);

function log(value) {
  console.log(value);
  return value;
}
```

Console:

```js
2 // ─── 1 + 1
2 // ┬── 1 + 1
6 // └── 2 * 3
```

Combining pipelines:

```js
const head1 = TVDML.createPipeline();
const head2 = TVDML.createPipeline();

const tail2 = head2
  .pipe(value => log(value + 3))
  .pipe(value => log(value + 4));

head1
  .pipe(value => log(value + 1))
  .pipe(tail2)
  .pipe(value => log(value + 2))
  .sink(1);

function log(value) {
  console.log(value);
  return value;
}
```

Console:

```js
2  // ┬── 1 + 1
5  // ├── 2 + 3
9  // ├── 5 + 4
11 // └── 9 + 2
```

#### Pipelines' public api

- `pipe(handler)` — Fork parent pipeline and create new one with applying transform provided by `handler` function. `handler` can be function or other stream or pipeline.

- `sink(value)` — Emit passed value to pipeline from its first pipe. Returns promise that will be resolved when all transforms in pipeline will process sinked value.

### Rules of combining streams and pipelines

- If stream is passed as `handler` it will pass incoming value to next pipe without changes.
- If pipeline is passed as `handler` it will return computed value to next pipe.

## Additional tools

### Detecting Menu button press

tvOS and TVJS aren't providing any way to detect Menu button activity on Apple TV Remote (Siri Remote). To be able to detect when user returns from active screen to previous TVDML provides special event that describes activitiy that is posible only with press of the Menu button.

```js
TVDML
  .subscribe('menu-button-press')
  .pipe(transition => {
    console.log(transition); // { from: { route, document, modal }, to: { route, document, modal } }
  });
```

With this snippet you can detect when user returned to specific screen and perform some activity like update results etc.

```js
function isMenuButtonPressNavigatedTo(targetDocument) {
  return ({ to: { document } }) => targetDocument === document;
}

class MyComponent extends React.PureComponent {
  componentDidMount() {
    const currentDocument = this.document.ownerDocument;

    this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
    this.menuButtonPressStream
      .pipe(isMenuButtonPressNavigatedTo(currentDocument))
      .pipe(isNavigated => isNavigated && this.loadData().then(this.setState.bind(this)));
  }

  componentWillUnmount() {
    this.menuButtonPressStream.unsubscribe();
  }

  loadData() {...}

  render() {
    return (
      <document ref={node => (this.document = node)}>
        ...
      </document>
    );
  }
}

TVDML
  .createPipeline()
  .pipe(TVDML.render(() => (
    <MyComponent />
  )));
```

## Sample code

You can check example application [written using TVDML](https://github.com/a-ignatov-parc/tvos-soap4.me) for [soap4.me](https://soap4.me/) video service.

Or [boilerplate app](https://github.com/a-ignatov-parc/tvdml-app-boilerplate) with base configuration and basic examples.

## Useful Links

- [React.js documentation](https://reactjs.org/docs/hello-world.html)
- [TVMLKit JS](https://developer.apple.com/reference/tvmljs)
- [TVML Programming Guide](https://developer.apple.com/library/content/documentation/TVMLKitJS/Conceptual/TVMLProgrammingGuide/)
- [Apple TV Markup Language Reference](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/)
- [Beginning tvOS Development with TVML Tutorial](http://www.raywenderlich.com/114886/beginning-tvos-development-with-tvml-tutorial) by Kelvin Lau ([@KelvinlauKl](https://twitter.com/KelvinlauKL))

## Contributions

1. Fork the project.
1. Commit your enhancements and bug fixes.
1. Create a pull request describing the changes.

## License

TVDML is released under the [MIT License](LICENSE).
