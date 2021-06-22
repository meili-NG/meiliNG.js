<h1 align="center">Meiling Gatekeeper</h1>
<p align="center">
  <strong>An easy-to-use, open-source, flexible oAuth2 Authentication Provider and OpenID Connect Server</strong>
</p>
<p align="center">
  Meiling Gatekeeper is very flexible, open-source, node.js based oAuth2 Server and <br>OpenID Connect Server for tweaking for your needs
</p>

<hr>

<p align="right">
  Fueled by Stella IT OpenSource Project Team with ❤️<br>
  <a href="https://opensource.stella-it.com/discord/">Join our Community</a>
</p> 

<hr>

## What is Meiling Gatekeeper?
Named after [a Gatekeeper in Touhou Project](https://hong.meili.ng),  
**Meiling Gatekeeper is a oAuth2 Server / OpenID Connect Server which is customizable and tweakable whenever and wherever you want.**

## Why should I use Meiling?
### Unbeatable customizability
Meiling Gatekeeper just gives you session token, everything you do on the front-end is totally free for you*.  
Just follow the API Specs and You can use whatever front-end design you want.

<sub>* Conditions apply, In order to use full compatibility Meiling Gatekeeper provides with OpenID, you need to follow some specs.</sub>

### Written in Node.JS
Meiling Gatekeeper is written in Node.JS and TypeScript, which you can easily understand. Tweak it whatever you want.

### Extensible Database with [Prisma](https://prisma.io)
Meiling Gatekeeper utilizes [Prisma 2](https://github.com/prisma/prisma), an ORM designed for Node.JS and TypeScript which can easily extend databases. You can modify and extend databases whatever you want*.

<sub>* Conditions apply, Customizing Database Schema can lead to drift if later versions of Meiling uses different schema, In that case you need to create migrations manually.</sub>

### Built for Modern Infrastructures
Meiling Gatekeeper supports Docker, PM2 out of the box. You just need to run it whatever you want*.

### Modern but compatible
Meiling Gatekeeper provides Modern APIs, but also provides great compatibility* with oAuth2 and OpenID specifications**.

<sub>* Your mileage may vary due to your server configuration. Also, Meiling gatekeeper is not finalized yet. expect bugs.
</sub>  
<sub>** Meiling Gatekeeper is <a href="https://user-images.githubusercontent.com/27724108/123002109-7abecf80-d3ec-11eb-85c8-5a349fe152c0.png">not OpenID Certified</a> at the moment. Please refer to <a href="https://github.com/meiling-gatekeeper/meiling/issues/16">Issue #16</a> for more information.</sub>

### Built to secure
Meiling Gatekeeper contains several security features such as:
* XSRF Token Support
* PKCE Support
* JWKS Support

### Easy and Familiarity
Meiling Gatekeeper's API Structure was designed after Google's oAuth2 API.  
If you are familiar with it, Using Meiling Gatekeeper needs just a little code change.  


## See Meiling in Production

### [Stella IT Accounts](https://accounts.stella-it.com)
> With **its flexibility,** Stella IT can provide **fully home-grown front-end and design** for account system which totally reflects Stella IT's Brand Design and Design Language.  
<p align="right">- <a href="https://github.com/Alex4386">Alex4386</a> - <b>Stella IT Inc.</b></p>


## Build Status

<table border="1" width="100%">
<tbody>
<tr>
<td align="center"><b>ESLint</b></td>
<td><img src="https://github.com/meiling-gatekeeper/meiling/workflows/ESLint/badge.svg" alt="ESLint"></td>
</tr>
</tbody>
</table>

## License
Distributed under [MIT License](LICENSE).  
