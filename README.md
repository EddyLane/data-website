# Vote for Policies Data Website

## About this website

The Vote for Policies Data website is a static website (HTML/CSS/JavaScript) that calls the Vote for Policies API for data.

## Tools used

- [DocPad](https://docpad.org/)
- [Browserify](http://browserify.org/)
- [UglifyJS](http://lisperator.net/uglifyjs/)
- [Watchify](https://github.com/substack/watchify)
- [Node-Sass](https://www.npmjs.com/package/node-sass)

## Style Guide

There are a set of style guidelines that have been developed for Vote
for Policies. We're using them to make the Data site consistent in style
as well. You can find them here: https://styleguide.voteforpolicies.org.uk/

> This is a working document to outline how various components and
  patterns should be used throughout the Vote for Policies website.

## Setting things up for development

```bash
# Install DocPad module globally
npm install -g docpad

# Install project module dependencies
npm install
```

## Development commands

```bash
# Watch for website changes and start the local DocPad web server
docpad run
```

```bash
# Watch for JavaScript changes and bundle them with Browserify (generates source map)
npm run watch:js
```

```bash
# Watch for scss changes with node-sass ( generates source maps )
npm run watch:scss
```
