import hljs from 'highlight.js'

const registerCodeShell = 'curl https://ratelimit.org/register?requests_count=4&time_frame=1000'

const registerCodeJS = `import axios from 'axios'

const params = 'requests_count=4&time_frame=1000'
const res = await axios.get(\`https://ratelimit.org/register?\${params}\`)
const data = res.data

console.log(data)`

const registerCodePython = `import requests

params = 'requests_count=4&time_frame=1000'
res = requests.get(f'https://ratelimit.org/register?{params}')
data = res.text

print(data)`

const registerCodeThe = `import request from "the/request"

params := "requests_count=4&time_frame=1000"
res := request.get("https://ratelimit.org/register?" + params)
data := res.data.str()

print(data)`

const requestCodeShell = 'curl https://ratelimit.org/{id}?url=https%3A%2F%2Fexample.com'

const requestCodeJS = `import axios from 'axios'

const params = 'url=https%3A%2F%2Fexample.com'
const res = await axios.get(\`https://ratelimit.org/{id}?\${params}\`)
const data = res.data

console.log(data)`

const requestCodePython = `import requests

params = 'url=https%3A%2F%2Fexample.com'
res = requests.get(f'https://ratelimit.org/{id}?{params}')
data = res.text

print(data)`

const requestCodeThe = `import request from "the/request"

params := "url=https%3A%2F%2Fexample.com"
res := request.get("https://ratelimit.org/{id}?" + params)
data := res.data.str()

print(data)`

export default (_req, res) => {
  res.render('home', {
    registerCodeShell: hljs.highlight(registerCodeShell, {
      language: 'shell'
    }).value,
    registerCodeJS: hljs.highlight(registerCodeJS, {
      language: 'javascript'
    }).value,
    registerCodePython: hljs.highlight(registerCodePython, {
      language: 'python'
    }).value,
    registerCodeThe: hljs.highlight(registerCodeThe, {
      language: 'the'
    }).value,
    requestCodeShell: hljs.highlight(requestCodeShell, {
      language: 'shell'
    }).value,
    requestCodeJS: hljs.highlight(requestCodeJS, {
      language: 'javascript'
    }).value,
    requestCodePython: hljs.highlight(requestCodePython, {
      language: 'python'
    }).value,
    requestCodeThe: hljs.highlight(requestCodeThe, {
      language: 'the'
    }).value
  })
}
