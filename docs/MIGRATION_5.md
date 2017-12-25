# Migration from `5.X`

## New TVML renderer with unified way to create documents

Now every document must be React.js component. And here is how you can migrate your old components

[Static documents](https://github.com/a-ignatov-parc/tvdml/tree/v5.1.1#rendering-static-document) translates to:

```js
TVDML
  .handleRoute('start')
  .pipe(TVDML.render(() => (
    <document>
      <alertTemplate>
        <title>Hello world</title>
        <button>
          <text>Ok</text>
        </button>
      </alertTemplate>
    </document>
  )));
```

[Rendering document with render factory](https://github.com/a-ignatov-parc/tvdml/tree/v5.1.1#rendering-custom-data-using-factory-approach) stays exactly the same.

To migrate your [interactive components](https://github.com/a-ignatov-parc/tvdml/tree/v5.1.1#creating-interactive-components) use [`create-react-class`](https://www.npmjs.com/package/create-react-class) module to transform old code to React.js components. Or update your old components to React.js ES6 syntax with [this guide](https://reactjs.org/docs/react-without-es6.html).

Updated example from "Load more" implementation

```js
import createReactClass from 'create-react-class';

const TVShows = createReactClass({
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
});

TVDML
  .handleRoute('start')
  .pipe(TVDML.render(() => (
    <TVShows />
  )));
```

## Updated `style` syntax

Update is pretty simple.

[This](https://github.com/a-ignatov-parc/tvdml/tree/v5.1.1#document-styles-and-class-names) example:

```js
<document>
  <head>
    <style content={`
      .controls_container {
        ...
      }
      ...
    `} />
  </head>
  <compilationTemplate>
    ...
  </compilationTemplate>
<document>
```

Goes to:

```js
<document>
  <head>
    <style>{`
      .controls_container {
        ...
      }
      ...
    `}</style>
  </head>
  <compilationTemplate>
    ...
  </compilationTemplate>
<document>
```

It's important to note that inline styles are must be defined as object with props named written in camelCase as keys.

[This styles](https://github.com/a-ignatov-parc/tvdml/tree/v5.1.1#inline-styles):

```js
<title style="tv-text-highlight-style: marquee-on-highlight; color: rgb(84, 82, 80)">
  Hello world
</title>
```

Transforms to:

```js
<title style={{
  tvTextHighlightStyle: 'marquee-on-highlight',
  color: 'rgb(84, 82, 80)',
}}>
  Hello world
</title>
```

## New `TVDML.renderModal()` rerendering behavour

Every next invocation of `TVDML.renderModal()` will rerender active modal without closing it.

Please check `TVDML.dismissModal()` if you need to keep old behavour.
