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

<a href="http://plnkr.co/edit/WS17mcxp9hzOvpJwbvjW?p=info" target="_blank">**Example 1.** </a>

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
In Example 1 we have one `trigger` - it's may be single object or array of objects - `trigger`s. You really can push any element selectors to this array, but I recommended to use "good" selectors which returns few elements. In optimizer we'll add event listener to trigger elements, thats way it would be better to have few trigger elements.

`dynamicTrigger` may be object or array of objects as well. `dynamicTrigger` used when you have elements which haven't compiled yet but will be available after optimizer compile `optimize-content`. E.g., you have a modal window with close button and background shadowed div which will be compiled only after modal window inited and opened, in this case you have to use dynamicTrigger. Settings for `dynamicTrigger` is the same as for main settings for optimizer, so you may use `preventInterval` and other parameters. Most likely, you may create recursive constructions as:

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


<a href="http://plnkr.co/edit/Fdd5jit1YXRUkKVlBHJV?p=info" target="_blank">**Example 2.**</a>
```javascript
$scope.optimizeSettings = {
   trigger: {                            //You can add multi triggers (array of triggers) if you want
      selector: '[href="#modal-create"]',
      event: 'click',
      preventInterval: false,             //You don't know how user can make your optimized element not visible
      interval: 500                       // and that's why want to check - is element still visible every 500ms
   },
   delay: 300                             //This delay belongs to all triggers: if you didn't set own delay for some trigger,
};                                        // this value (300ms) will be inherited
```


<a href="http://plnkr.co/edit/lp3KWdRT0gQrtq9lyek8?p=info" target="_blank">**Example 3.**</a>
```javascript
$scope.optimizeSettings = {
   trigger: {
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
   }
};
```

<a href="http://plnkr.co/edit/VEz85oxzkzi5K6tykDMS?p=info" target="_blank">**Example 4.**</a>
```javascript
$scope.optimizeSettings = {
   trigger: [                                 //We have array of triggers
      {
         selector: '#modal-create-trigger',
         event: 'click',
         delay: 30,                           //This delay will be inherited by dynamicTrigger
         dynamicTrigger: [
            {
               selector: '.lean-overlay',
               event: 'click'
            },
            {
               selector: '.modal-close',
               event: 'click'
            },
         ]
      },
      {
         selector: '#modal-create-trigger-alt',
         event: 'click',                    //delay is not set yet, that's why it will be inherited from parent (= 300ms)
         dynamicTrigger: [
            {                               //delay will be inherited from parent (= 300ms as well)
               selector: '.lean-overlay',
               event: 'click'
            },
            {
               selector: '.modal-close',
               event: 'click'
            },
         ]
      }
   ],
   delay: 300              //This settings will be inherited from trigger and dynamicTrigger
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
