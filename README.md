<h1 align="center">meiliNG</h1>
<p align="center">
  <strong>meiliNG</strong>: Easy Identity/Login Infrastructure, Next Generation
</p>

<p align="center">
  <a href="https://github.com/meili-ng/meiliNG/actions/workflows/eslint.yml"><img src="https://github.com/meili-ng/meiliNG/actions/workflows/eslint.yml/badge.svg" /></a>
  <a href="https://github.com/meili-ng/meiliNG/actions/workflows/tsc.yml"><img src="https://github.com/meili-ng/meiliNG/actions/workflows/tsc.yml/badge.svg" /></a>
</p>

<hr>

**Roadmap:** Currently planning to create a "Go" version of the meiliNG for further performance boost! APIs will be backwards compatible with meiliNG.js.  

<hr>

## What is meiliNG?
Named after [a Gatekeeper in Touhou Project](https://hong.meili.ng), (pronounced: meh-i-[ling](https://www.lingscars.com))  
**meiliNG is an easy-to-use "next generation" identity/login provider that supports oAuth2 and OpenID Connect specs designed for customization and tweakability from ground-up.**

## Why should I use meiliNG?
### Unbeatable customizability
meiliNG just gives you session token, everything you do on the front-end is totally free for you*.  
Just follow the API Specs and You can use whatever front-end design you want.

<sub>* Conditions apply, In order to use full compatibility meiliNG provides with OpenID, you need to follow some specs.</sub>

### Written in Node.JS
meiliNG is written in Node.JS and TypeScript, that you can  understand easily. Tweak it whatever you want.

### Extensible Database with [Prisma](https://prisma.io)
meiliNG utilizes [Prisma](https://github.com/prisma/prisma), an ORM designed for Node.JS and TypeScript that you can easily extend databases. You can modify and extend databases whatever you want*.

<sub>* Conditions apply, Customizing Database Schema can lead to drift if later versions of meiliNG uses different schema, In that case you need to create migrations manually.</sub>

### Built for Modern Infrastructures
meiliNG supports Docker, PM2 out of the box. You just need to run it whatever you want*.

### Modern but compatible
meiliNG provides Modern APIs, but also provides great compatibility* with oAuth2 and OpenID specifications**.

<sub>* Your mileage may vary due to your server configuration. Also, meiliNG is not finalized yet. expect bugs.
</sub>  
<sub>** meiliNG is <a href="https://user-images.githubusercontent.com/27724108/123002109-7abecf80-d3ec-11eb-85c8-5a349fe152c0.png">not OpenID Certified</a> at the moment. Please refer to <a href="https://github.com/meiling-gatekeeper/meiling/issues/16">Issue #16</a> for more information.</sub>

### Built to secure
meiliNG contains several security features such as:
* XSRF Token Support
* PKCE Support
* JWKS Support

### Easy and Familiarity
meiliNG's API Structure was designed after Google's oAuth2 API.  
If you are familiar with it, Using meiliNG needs just a little code change.  


## Documentations
These are the documentations for helping you try meiliNG on your hands!

* **API Docs**: [https://documenter.getpostman.com/view/14310965/TWDXnc3q](https://documenter.getpostman.com/view/14310965/TWDXnc3q)
* **Install Guide**: [./INSTALL.md](./INSTALL.md)

## License
Distributed under [MIT License](LICENSE).  
If the [MIT License](LICENSE) does not cover you, You can use [Hakurei Reimu Public License](https://github.com/Alex4386/HRPL) instead. [(EXT_LICENSE)](EXT_LICENSE) An Open-Source License considering all-beings (such as AI, like GitHub Copilot)  

You can activate License Extension by following this file: [APPLY_EXTENSION.md](APPLY_EXTENSION.md)
