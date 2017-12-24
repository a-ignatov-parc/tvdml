# TVDML [![CircleCI](https://circleci.com/gh/a-ignatov-parc/tvdml.svg?style=svg)](https://circleci.com/gh/a-ignatov-parc/tvdml)

- [Intro](#intro)
- [System Requirements](#system-requirements)
- [Getting started](#getting-started)
- [Routing](#routing)
- [Templating and styling](#templating-and-styling)
  - [Rendering static document](#rendering-static-document)
  - [Rendering custom data using factory approach](#rendering-custom-data-using-factory-approach)
  - [Requesting and rendering data](#requesting-and-rendering-data)
    - [Important note](#important-note)
  - [Events](#events)
  - [Modals](#modals)
  - [Working with rendered elements](#working-with-rendered-elements)
  - [Creating interactive components](#creating-interactive-components)
  - [Partials](#partials)
  - [Styling elements](#styling-elements)
    - [Inline styles](#inline-styles)
    - [Document styles and class names](#document-styles-and-class-names)
  - [Working with `menuBar`](#working-with-menubar)
  - [Working with `DataItem`](#working-with-dataitem)
  - [Complete rendering module api](#complete-rendering-module-api)
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

## Intro

This is a library that main goal is to greatly simplify app development for Apple TV using [React.js](https://reactjs.org/) and providing tools to solve problems like:

- React.js integration with TVML and TVJS.
- Routing.
- Event binding.
- Detecting "Menu" button.

## System Requirements

Starting from `v4.X.X` TVDML drops support for tvOS < 10. If you need that support please consider using [`v3.X.X`](https://github.com/a-ignatov-parc/tvdml/tree/v3.0.4).

## Getting started

TVDML is shipping as [npm package](https://www.npmjs.com/package/tvdml) and can be installed with npm. In addition you need to install React.js.

```
npm install --save tvdml react
```

TVDML is written in ES6 and built using UMD wrapper so it can be used in any environment with any of this ways:

```javascript
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

```javascript
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

```javascript
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

tvOS provided great foundation to write apps using [TVML](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/index.html) and [TVJS](https://developer.apple.com/reference/tvmljs). But you need somehow to react on user's activity and map it to UI.

To help you solving this issues TVDML provides navigation module.

```javascript
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

> This is small example of using navigation and rendering modules to handle routes and show them to user.

Here is a complete api of navigation module:

- `TVDML.handleRoute(routeName)` — Creates pipeline for route handling. Only one pipeline can be created for the route. Otherwise it will throw error.

- `TVDML.dismissRoute(routeName)` — Destroy previously created route pipeline. Can destroy only created pipelines. Otherwise it will throw error.

- `TVDML.navigate(routeName[, params][, isRedirect])` — Navigation trigger. Will invoke registered route pipeline with passed params if they are specified. Route pipeline will result in creating new navigation document. if param `isRedirect` is passed then route pipeline will replace current navigation document with new one.

- `TVDML.redirect(routeName[, params])` — Same as `TVDML.navigate(routeName, params, true)`.

```javascript
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

> To know more about how pipelines works check [Pipelines](#pipelines) section.

Also there are some predefined routes that may help you:

- `TVDML.route.NOT_FOUND` — Will be invoked when navigation module was unable to find match to requested route.

The next big thing is...

## Using React.js

With TVDML your main way to create documents will be React.js.

> Here is a [list of all available documents](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/TextboxTemplate.html) in TVML.

To render any react component you need to provide rendering factory to `TVDML.render` pipeline.

Pipeline's payload will be passed as first argument to rendering factory so you'll be able to map it's props to rendering tree.

```javascript
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

```javascript
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
    <Hello name='user' />
  )));
```

It's just plain old React.js.

But there are some things you need to remember about TVML and React.js.

Because TVML and TVJS are not your normal browser they have some limitations. And to be able to work with them as best as possible react's tvml renderer have some quirks:

1. `style` prop is just simple string not an object.
1. To set `class` attribute just use `class` prop. There is no `className`.
1. Attribute names should be written in props as they written in [docs](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/TVJSAttributes.html).
1. Events are normal DOM events provided by TVML.

Everythin else should be as you expected.

So lets talk about styling.

### Styling elements

There are two ways to style elements:

1. Using `style` prop.
1. Using `<style>` element with `class` prop.

```javascript
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
        <title class='title'>Hello user</title>
        <description style='tv-text-style: title2'>
          Nice to see you
        </description>
      </alertTemplate>
    </document>
  )));
```

All available styles can be found here: [TVML Styles](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/ITMLStyles.html).

### Events

It's easy to bind event handlers using JSX. All you need to do is add one of the available handlers as attribute on controllable element.

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

```javascript
<button onSelect={event => console.log(event.target)}>
  <text>Press Me</text>
</button>
```

### Modals

Modals are perfect when you need to show some useful information but don't want to interupt opened view context. You can use `TVDML.renderModal()` method to render any document you want in overlay. `TVDML.renderModal()` behaviour is similar to `TVDML.render()`.

There is also `TVDML.removeModal()` method that removes any presented modal document.

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(() => TVDML.navigate('start'));

TVDML
  .handleRoute('start')
  .pipe(downloadTVShows())
  .pipe(TVDML.render(tvshows => {
    return (
      <document>
        <stackTemplate>
          <banner>
            <title>TV Shows</title>
          </banner>
          <collectionList>
            <grid>
              {tvshows.map(tvshow => {
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
    );
  }));

function showTVShowDescription(tvshow) {
  TVDML

    // Creating modal document rendering pipeline.
    .renderModal(
      <document>
        <descriptiveAlertTemplate>
          <title>{tvshow.title}</title>
          <description>{tvshow.description}</description>
        </descriptiveAlertTemplate>
      </document>
    )

    // Invoking created pipeline.
    .sink();
}
```

### Working with rendered elements

TVDML provides you with `ref` mechanism to help with access to rendered document nodes. This is useful when you need to get features of elements like: `textField`, `searchField` and `menuBar`.

```javascript
<document>
  <searchTemplate>
    <searchField ref={node => {
      console.log(node.getFeature('Keyboard').text);
    }} />
  </searchTemplate>
</document>
```

That was easy! Right? But how can we update views depending on user activity?

That is a good question and that is where TVDML components comes to the rescue!

### Creating interactive components

I think at least someone has notised that some approaches used in TVDML are similar to those that used is react.js and you will be right! No! There is no react.js inside TVDML but it's hard to argue that its ideas are greatly fit to app development for Apple TV. React.js Components lifecycle are one of them.

`TVDML.createComponent` tries to behave as much as posible as React.js component but with some limitations:

1. There is no need for child components in TVDML so this feature isn't supported. But is a subject to change in future.
1. Rendering mechanism are different from ones used in react.js so interoperability with react components are not tested and most likely not possible.

What is not supported (from [Component Specs and Lifecycle](https://facebook.github.io/react/docs/component-specs.html)):

- `propTypes`
- `mixins`
- `statics`
- `displayName`

Lets see how previous example will look like if it were written using TVDML components:

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(() => TVDML.navigate('start'));

TVDML
  .handleRoute('start')
  .pipe(downloadTVShows())
  .pipe(TVDML.render(TVDML.createComponent({
    render() {
      return (
        <document>
          <stackTemplate>
            <banner>
              <title>TV Shows</title>
            </banner>
            <collectionList>
              <grid>
                {this.props.tvshows.map(tvshow => {
                  return (
                    <lockup key={tvshow.id}>
                      <img src={tvshow.cover} width="250" height="250" />
                      <title>{tvshow.title}</title>
                    </lockup>
                  );
                })}
              </grid>
            </collectionList>
          </stackTemplate>
        </document>
      );
    },
  })));
```

As you can see the main diference is that we need to specify `render` method and `tvshows` are now retrieved from `this.props` object.

> The whole payload passed to `TVDML.render()` will be available as `this.props`.

Now lets implement "Load more" button with pagination and spinner for initial loading.

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(() => TVDML.navigate('start'));

TVDML
  .handleRoute('start')
  .pipe(TVDML.render(TVDML.createComponent({
    getInitialState() {
      return {
        page: 1,
        tvshows: [],
        loading: true,
      };
    },

    componentDidMount() {
      // Loading initial tv shows list when component is mounted
      downloadTVShows(this.state.page).then(tvshows => {
        this.setState({
          tvshows,
          loading: false,
        });
      });
    },

    render() {
      // Showing spinner while initial data is loading
      if (this.state.loading) {
        return (
          <document>
            <loadingTemplate>
              <activityIndicator />
            </loadingTemplate>
          </document>
        );
      }

      return (
        <document>
          <stackTemplate>
            <banner>
              <title>TV Shows</title>
            </banner>
            <collectionList>
              <grid>
                {this.state.tvshows.map(tvshow => {
                  return (
                    <lockup key={tvshow.id}>
                      <img src={tvshow.cover} width="250" height="250" />
                      <title>{tvshow.title}</title>
                    </lockup>
                  );
                })}
              </grid>
              <separator>
                <button onSelect={this.onLoadNextPage}>
                  <text>Load page #{this.state.page + 1}</text>
                </button>
              </separator>
            </collectionList>
          </stackTemplate>
        </document>
      );
    },

    onLoadNextPage() {
      const nextPage = this.state.page + 1;

      // Loading next page and merging new data with existing.
      // Document update will be immediately invoked on state change.
      downloadTVShows(nextPage).then(tvshows => {
        this.setState({
          page: nextPage,
          tvshows: this.state.tvshows.concat(tvshows),
        });
      });
    },
  })));
```

Looks nice! But what can we do with document parts that are need to be reused in other places? Please welcome partials!

### Partials

Partials are elements that can encapsulate complex markup and logic. They can be distinguished by names that starts with capital letters.

```javascript
TVDML.createComponent({
  render() {
    // Showing spinner while initial data is loading
    if (this.state.loading) {
      return <Loader title="Loading..." />;
    }
  },
})
```

So how is `<Loading />` looks from the inside.

```javascript
function Loader({ attrs = {} }) {
  const { title } = attrs;

  return (
    <document>
      <loadingTemplate>
        <activityIndicator>
          <title>{title}</title>
        </activityIndicator>
      </loadingTemplate>
    </document>
  );
}
```

Partials will receive `node` object in [UVDOM notation](https://github.com/gcanti/uvdom#uvdom-formal-type-definition) as first argument.

`Loader` partial in our example will receive next object:

```javascript
{
  tag: function Loader() {...},
  attrs: {
    title: 'Loading...'
  }
}
```

Full `node` specification:

```javascript
{
  tag: string | function,
  attrs: {
    key: string,
    ...
  },
  events: {
    eventName: function,
    ...
  },
  key: string,
  ref: function,
  children: string | node | array<string | node>
}
```

The last thing that we need to cover is how to style elements.

### Styling elements

There is a big [section in TVML documentation](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/ITMLStyles.html) related to elements styling. And there are two ways you can attach styles to elements.

#### Inline styles

You can write styles directly on elements using `style` attribute.

```javascript
<title style="tv-text-highlight-style: marquee-on-highlight; color: rgb(84, 82, 80)">
  Hello world
</title>
```

If you need to set multiple of styles on one element you can use ES6 template literals (template strings) in JSX.

```javascript
<textBadge
  type="fill"
  style={`
    font-size: 20;
    border-radius: 30;
    margin: 0 10 12 0;
    padding: 1 8;
    tv-align: right;
    tv-position: bottom;
    tv-tint-color: rgb(255, 255, 255);
  `}
>{counter}</textBadge>
```

#### Document styles and class names

If you have repeated styles or want to keep all styles in one place then you should use document styles. They are must be defined in `<style />` tag inside document's `<head />`.

```javascript
<document>
  <head>
    <style content={`
      .controls_container {
        margin: 40 0 0;
        tv-align: center;
        tv-content-align: top;
      }

      .control {
        margin: 0 24;
      }

      .item {
        background-color: rgba(255, 255, 255, 0.05);
        tv-highlight-color: rgba(255, 255, 255, 0.9);
      }

      .item--disabled {
        color: rgba(0, 0, 0, 0.3);
      }

      .title {
        tv-text-highlight-style: marquee-on-highlight;
      }
    `} />
  </head>
  <compilationTemplate>
    ...
  </compilationTemplate>
<document>
```

> `style` tag is TVDML's predefined partial.

After defining class names you can attach them to elements using `class` attribute.

```javascript
<buttonLockup class="control">
  <badge src="resource://button-remove" />
  <title>Mark as Unwatched</title>
</buttonLockup>

<listItemLockup class="item item--disabled">
  <ordinal minLength="3">
    {episodeNumber}
  </ordinal>
  <title class="title">
    {episode.title}
  </title>
  <decorationLabel>
    {dateTitle}
  </decorationLabel>
</listItemLockup>
```

### Working with `menuBar`

One of the trickiest things in TVML is configure and use [menu bar](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/MenuBarTemplate.html) across multiple views.

TVDML provides easy to use solution for this issue.

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(() => TVDML.navigate('main'));

TVDML
  .handleRoute('main')
  .pipe(TVDML.render(
    <document>
      <menuBarTemplate>
        <menuBar>
          <menuItem route="search">
            <title>Search</title>
          </menuItem>
          <menuItem autoHighlight="true" route="my">
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
  ));

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

### Working with `DataItem`

In tvOS 11 [`DataItem`](https://developer.apple.com/documentation/tvmljs/dataitem) binding api was presented to fix performance issues with large documents that may ended up with very long parsing and rendering.

Here is a [short example](https://developer.apple.com/library/content/documentation/TVMLKitJS/Conceptual/TVMLProgrammingGuide/GeneratingContentForYourApp.html) how apple suggests to use it.

So now you may wondering how we can use this cool feature in JSX?

We got you covered! Here is an updated example from "[Requesting and rendering data](#requesting-and-rendering-data)" section:

```javascript
TVDML
  .handleRoute('start')
  .pipe(downloadTVShows())
  .pipe(TVDML.render(tvshows => {
    return (
      <document>
        <stackTemplate>
          <banner>
            <title>TV Shows</title>
          </banner>
          <collectionList>
            <grid>
              <prototypes>
                <lockup prototype="tvshow">
                  <img binding="@src:{cover}" width="250" height="250" />
                  <title binding="textContent:{title}" />
                </lockup>
              </prototypes>
              <section
                binding="items:{tvshows}"
                dataItem={{
                  tvshows: tvshows.map(tvshow => {
                    const item = new DataItem('tvshow', tvshow.id);

                    item.cover = tvshow.cover;
                    item.title = tvshow.title;

                    return item;
                  }),
                }}
              />
            </grid>
          </collectionList>
        </stackTemplate>
      </document>
    );
  }));
```

The key difference from the example provided by Apple is `dataItem` attribute. It's responsible to apply `DataItems` to final document and this:

```javascript
<section
  binding="items:{tvshows}"
  dataItem={{
    tvshows: tvshows.map(tvshow => {
      const item = new DataItem('tvshow', tvshow.id);

      item.cover = tvshow.cover;
      item.title = tvshow.title;

      return item;
    }),
  }}
/>
```

Is same as:

```javascript
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

### Complete rendering module api

- `TVDML.render(template)` — Main rendering factory that transforms JSX templates to TVML documents and responsible for rendering them to screen. Uses `TVDML.parseDocument` to parse and evaluate `template` object into TVML document before applying to `NavigationDocument`.

- `TVDML.parseDocument(template)` — Responsible for transforming JSX templates to TVML documents. In most cases you are not supposed to use this method but it may be useful to create documents for `player.overlayDocument` or `player.interactiveOverlayDocument`.

  `template` can be:

  - JSX template.
  - function that will return JSX template on execution.

  Remember that you need to manualy mount/unmount documents created with `TVDML.createComponent`. This can be done with `document.didMount` and `document.destroyComponent`. Also there is `document.updateComponent` for updating mounted component.

- `TVDML.renderModal(template)` — Same as `TVDML.render(template)` but will render passed document in modal overlay.

- `TVDML.removeModal()` — Removes any rendered modals.

- `TVDML.createComponent(spec)` — You should provide a specification object that contains at least `render` method and can optionaly contains other lifecycle methods described [here](https://facebook.github.io/react/docs/component-specs.html). Please check for differences with react.js specification in [Creating interactive components](#creating-interactive-components) section.

- `TVDML.jsx` — Transforms virtual DOM elements from JSX notation into [hyperscript](https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript) notation.

## Pipelines and Streams

To be able to easily manage your data flows TVDML provides two additional utils. They are **Streams** and **Pipelines**. They have similar api but a little different behaviours. All core functionality in TVDML is based upon them.

### Streams

Streams can be created using `TVDML.createStream()` factory and can be described as event bus with ability to combine transforms and create forks. Here is an example:

```javascript
const head = TVDML.createStream();

head.pipe(value => console.log(value));
head.pipe(value => console.log(value));

head.sink(1);
```

Console:

```javascript
1
1
```

This code will be resulted with two records in the console because we create two forks of the main stream and all of them will receive sinked value.

Every `pipe` creates another stream that can be used separately:

```javascript
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

```javascript
2 // ┬── 1 + 1
3 // │ ─── 1 * 3
6 // └── 2 * 3
```

As you can see `2` and `6` were produced by sinking `1` to `head` stream and `3` were produced by sinking `1` to `tail` stream. `3` is placed between `2` and `6` because of using promises to resolve pipes.

> Promises execution scheduled after current event loop.

Streams can be combined:

```javascript
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

```javascript
2 // ┬─┬ 1 + 1
5 // │ ├── 2 + 3
9 // │ └── 5 + 4
4 // └── 2 + 2
```

Pipe transformations supports promised operations:

```javascript
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

```javascript
2 // (100ms)
4
```

#### Streams' public api

- `pipe(handler)` — Fork parent stream and apply transform provided by `handler` function. `handler` can be function or other stream.

- `sink(value)` — Emit passed value to stream and all of its forks. Returns promise that will be resolved when all branches will process sinked value.

### Pipelines

Pipelines are streams too. But instead sinking values from the starting point of the stream you create processing pipeline with transformations and sink values from its end. Only requested brunch will be executed. Other forks stays untouched.

Let's compare with streams' first example:

```javascript
const head = TVDML.createPipeline();

head.pipe(value => console.log(value));
head
  .pipe(value => console.log(value))
  .sink(1);
```

Console:

```javascript
1
```

As we can see only sinked branch were exected.

Let's compare other examples:

```javascript
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

```javascript
2 // ─── 1 + 1
2 // ┬── 1 + 1
6 // └── 2 * 3
```

Combining pipelines:

```javascript
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

```javascript
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

```javascript
TVDML
  .subscribe('menu-button-press')
  .pipe(transition => {
    console.log(transition); // { from: { route, document, modal }, to: { route, document, modal } }
  });
```

With this snippet you can detect when user returned to specific screen and perform some activity like update results etc.

```javascript
TVDML
  .createPipeline()
  .pipe(TVDML.render(TVDML.createComponent({
    componentDidMount() {
      const currentDocument = this._rootNode.ownerDocument;

      this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
      this.menuButtonPressStream
        .pipe(isMenuButtonPressNavigatedTo(currentDocument))
        .pipe(isNavigated => isNavigated && this.loadData().then(this.setState.bind(this)));
    },

    componentWillUnmount() {
      this.menuButtonPressStream.unsubscribe();
    },

    loadData() {...},

    render() {...},
  })));

function isMenuButtonPressNavigatedTo(targetDocument) {
  return ({ to: { document } }) => {
    const { menuBarDocument } = document;

    if (menuBarDocument) {
      document = menuBarDocument.getDocument(menuBarDocument.getSelectedItem());
    }

    return targetDocument === document;
  }
}
```

## Sample code

You can check example application [written using TVDML](https://github.com/a-ignatov-parc/tvos-soap4.me) for [soap4.me](https://soap4.me/) video service.

## Useful Links

- [TVMLKit JS](https://developer.apple.com/reference/tvmljs)
- [TVML Programming Guide](https://developer.apple.com/library/content/documentation/TVMLKitJS/Conceptual/TVMLProgrammingGuide/)
- [Apple TV Markup Language Reference](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/)
- [Beginning tvOS Development with TVML Tutorial](http://www.raywenderlich.com/114886/beginning-tvos-development-with-tvml-tutorial) by Kelvin Lau ([@KelvinlauKl](https://twitter.com/KelvinlauKL))

## Contributions

1. Fork the project
1. Commit your enhancements and bug fixes
1. Create a pull request describing the changes

## License

TVDML is released under the [MIT License](LICENSE).
