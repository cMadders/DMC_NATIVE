# DMC Native

## WORKSTATION REQUIREMENTS

* [Node](https://nodejs.org/en/) version 6.9.2
* [Grunt CLI](https://github.com/gruntjs/grunt-cli)
* Mongo _(Optional. Only required if you want a local version of the database for dev purposes)_

## DEVELOPMENT

* Clone repo, `git clone git@github.com:cMadders/DMC_NATIVE.git`
* Install project dependencies, 'npm install'
* Open 2 termnial windows
  * 1.  run `npm run dev` // starts application
  * 2.  run `grunt watch` // watches for changes to .less and .js files; executes page refresh on changes to files
* Browse to _http://localhost:3000_

### XUL ENDPOINTS

* http://api.digitalmediacommunications.com:8080/getNativeAdsByPub/
* http://api.digitalmediacommunications.com:8080/getListingInfoByAdnumber/
* http://api.digitalmediacommunications.com:8080/getListingInfo/

## DEPLOYMENT

* coming soon...

## FOR PUBLISHERS

_example web page embed_

```
<script id="dmc-fcf8" type="text/javascript" src="https://native.digitalmediacommunications.com/adunit/fcf8" async></script>
```

_example web page embed with the same ad unit multiple times_

```
<!-- DMC #1 -->
<script id="dmc-fcf8" type="text/javascript" src="//native.digitalmediacommunications.com/adunit/fcf8" async></script>

<p>Lorem ipsum dolor sit met, consectetur adipiscing elit. Nunc vel elit viverra, pulvinar purus in, sojales elit. Phasellus lorem neque, pretium sit met torero eu, aliquet placerat</p>

<!-- DMC #2 -->
<script id="dmc-fcf8-2" type="text/javascript" src="//native.digitalmediacommunications.com/adunit/fcf8/2" async></script>

<p>Lorem ipsum dolor sit met, consectetur adipiscing elit. Nunc vel elit viverra, pulvinar purus in, sojales elit. Phasellus lorem neque, pretium sit met torero eu, aliquet placerat</p>

<!-- DMC #3 -->
<script id="dmc-fcf8-3" type="text/javascript" src="//native.digitalmediacommunications.com/adunit/fcf8/3" async></script>
```
