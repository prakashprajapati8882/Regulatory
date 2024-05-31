// to show the folder tree in the console.

const tree = require('tree-directory')

tree(__dirname + '/src', '**/*.js').then(function (res) {
    console.log(res)
})