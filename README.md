#optimizer 1.0 + angularjs
Optimizer removes content of elements from DOM in angular apps if element is not visible; it's working like ng-if with dynamic elements support

##Licence
Code licensed under MIT license.

##Examples

http://mikhailzotov.github.io/optimizer/

## Get Started

###Module
Don't forget to include optimizer module!
```javascript
anuglar.module('some-module-name', ['optimizer',...])
```

###Optimize default settings
You can set optimizer settings in your page controller. There are plenty ways to init your settings.
Let's see default settings

```javascript
defaultSettings = {
   delay: 50,             //optimization will be applied (and reverted) after 50ms (when trigger event emitted)
   preventInterval: true, //by default we expect that you know which elements will be triggers for hide/show your optimized
                          //  element, if you don't - set this parameter to 'false'
   interval: 1000         //if preventInterval is true it means you don't know when your element will be not visible.
                          // Optimizer will check visibility every 1000ms once your element become visible.
}
```

###Usage
In your controller you may use next ways to init optimizer.

**Example 1.**
```javascript

$scope.optimizeSettings = {
   trigger: {
      selector: '[href="#modal-create"]', //This element(s) will be a trigger(s) for optimizer
      event: 'click',                     //Event for applying optimization
      dynamicTrigger: {                   //If you have dynamic elements which will be a triggers as well,
                                          // you may put them to dynamicTrigger object
         selector: '.lean-overlay',
         event: 'click',
         delay: 500                       //Delay for checking visibility of your optimized element. We set it to 500ms
                                          // because we have animation and immidiately after triggering element will still visible
      }
   }
};
```
`dynamicTrigger` may be object or array of objects. `dynamicTrigger` used when you have elements which haven't compiled yet but will be available after optimizer compile `optimize-content`. E.g., you have a modal window with close button and background shadowed div which will be compiled only after modal window inited and opened, in this case you have to use dynamicTrigger. Settings for `dynamicTrigger` is the same as for main settings for optimizer, so you may use `preventInterval` and other parameters. Most likely, you may create recursive constructions as:

```javascript
$scope.optimizeSettings = {
   trigger: {
      ...,
      dynamicTrigger: {
        ...,
        dynamicTrigger: {
          ...,
          dynamicTrigger: {
            ...
```
but it's not tested yet :). Such recursive constructions may be useful in nested dropdowns

**Example 2.** http://embed.plnkr.co/WS17mcxp9hzOvpJwbvjW
```javascript
$scope.optimizeSettings = {
   trigger: [{                            //You can add multi triggers (array of triggers)
      selector: '[href="#modal-create"]',
      event: 'click',
      delay: 0,
      preventInterval: false,             //You don't know how user can make your optimized element not visible
      interval: 500                       // and thats why want to check - is element still visible every 500ms
   },
   {
     selector: '.modal-close',
     event: 'click'
   }],
   delay: 500                             //This delay belongs to all triggers: if you didn't set own delay for some trigger,
};                                        // this value (300ms) will be inherited
```

In Example 2 we have array of triggers. You really can push any element selectors to this array, but I recommended to use "good" selectors which returns few elements. In optimizer we'll add event listener to trigger elements, thats way it would be better to have few trigger elements.


**Example 3.**
```javascript
$scope.optimizeSettings = {
   trigger: {
      selector: '[href="#modal-create"]',
      event: 'click',
      delay: 100,             //This settings will be inherited from dynamicTrigger
      preventInterval: false, //And this
      interval: 500,          //And this
      dynamicTrigger: [
         {
            selector: '.lean-overlay',
            event: 'click',
            delay: 500
         },
         {
            selector: '.modal-close',
            event: 'click'
         },
      ]
   }
};
```

**Example 4.**
```javascript
$scope.optimizeSettings = {
   trigger: [                                 //Again we have array of triggers
      {
         selector: '[href="#modal-create"]',
         event: 'click',
         dynamicTrigger: [
            {
               selector: '.lean-overlay',
               event: 'click',
               delay: 500
            },
            {
               selector: '.modal-close',
               event: 'click'
            },
         ]
      },
      {
         selector: '.modal-create-open',
         event: 'click'
      }
   ],
   delay: 100,              //This settings will be inherited from trigger and dynamicTrigger
   preventInterval: false,  //And this
   interval: 500,           //And this
};
```

###HTML markup
* Add **optimize** directive to element which will be hidden sometime (we check ``element.is(':visible')`` property)
* Add **optimize-settings** directive to the same element
* Add **optimize-content** to inner part of element: this part will be optimized (compiled/removed to/from DOM)

```html
<div id="modal-create" class="modal modal-fixed-footer" optimize optimize-settings="optimizeSettings">
   <form name="createForm" optimize-content>  <-- This part will be removed from DOM on optimizing -->
   ...
   </form>
```


##How it works
We believe, that core concept of `optimize` is simplicity. If element with `optimize` attribute is not visible, inner element with `optimize-content` attribute won't be compiled. That's all.

For compile/removing `optimize-content` I use the same approach as for `ng-if` directive in angular (just copy-paste from `angular 1.5.5`) but without watching changes for `optimize-content` attribute. Optimization applying only if visibility of element with `optimize` attribute changed.

If your `selector` returns set of elements, `event` will be bind to each element from selector.

`delay` used when you have animation for element and only after animation finished, element become visible/not visible. Deafult value is 50ms.

`preventInterval` - is boolean, default value is `true` - that means than `$interval` won't be used for checking - is element still visible or not. If you set `preventInterval` to `false`, optimizer will check every `interval` ms - is element still visible or not.

`interval` - time for checking visibility of the optimized element. default value is 1000ms
