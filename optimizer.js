(function (angular) {
   'use strict';


   optimizeDirective.$inject = ['$parse', '$timeout', '$interval'];
   optimizeContentDirective.$inject = ['$animate', '$compile'];

   angular.module('optimize', [])
      .directive('optimize', optimizeDirective)
      .directive('optimizeContent', optimizeContentDirective);

   var Event = function () {
      var events = [];

      this.on = function (f) {
         events.push(f);
         return function () {
            var index = events.indexOf(f);
            if (index >= 0) {
               events.splice(index, 1);
            }
         }
      };

      this.emit = function (e) {
         var temp = angular.copy(events);
         for (var i = 0, length = temp.length; i < length; i++) {
            temp[i](e);
         }
      };
   };

   function optimizeController() {
      var self = this;

      this.propagateEvent = new Event();

      this.destroy = function () {
         self.propagateEvent = null;
      }
   }

   function getBlockNodes(nodes) {
      var node = nodes[0];
      var endNode = nodes[nodes.length - 1];
      var blockNodes;

      for (var i = 1; node !== endNode && (node = node.nextSibling); i++) {
         if (blockNodes || nodes[i] !== node) {
            if (!blockNodes) {
               blockNodes = $(slice.call(nodes, 0, i));
            }
            blockNodes.push(node);
         }
      }

      return blockNodes || nodes;
   }

   function optimizeDirective($parse, $timeout, $interval) {
      return {
         restrict: 'A',
         controller: optimizeController,
         require: 'optimize',
         link: function (scope, element, attrs, ctrl) {

            var settings = $parse(attrs.optimizeSettings)(scope);

            if (!settings.trigger || angular.isArray(settings.trigger) && !settings.trigger.length) {
               throw new Error('optimize trigger options is not set');
            }

            var optimize = ctrl;

            settings = angular.extend({
               delay: 50,
               preventInterval: true,
               interval: 1000
            }, settings);


            var bindTriggers = function () {

               var bindTrigger = function (trigger) {
                  trigger = angular.extend({
                     delay: 50,
                     preventInterval: settings.preventInterval,
                     interval: 1000
                  }, trigger);

                  var triggerElements = angular.element(trigger.selector);

                  var applyOptimization = function () {

                     var stop;

                     var watchChanges = trigger.preventInterval
                        ? function (f) {
                        f();
                     }
                        : function (f, time) {
                        stop = $interval(f, time);
                     };

                     var watchChangesOff = trigger.preventInterval
                        ? angular.noop
                        : function () {
                        $interval.cancel(stop);
                     };

                     var stopTimeout = $timeout(function () {
                        var isHidden = !element.is(':visible');

                        if (!isHidden) {
                           optimize.propagateEvent.emit('compiled');

                           if (trigger.dynamicTrigger) {

                              if (angular.isArray(trigger.dynamicTrigger)) {
                                 angular.forEach(trigger.dynamicTrigger, bindTrigger);
                              }
                              else if (angular.isObject(trigger.dynamicTrigger)) {
                                 bindTrigger(trigger.dynamicTrigger);
                              }
                           }


                           watchChanges(function () {
                              isHidden = !element.is(':visible');

                              if (isHidden) {
                                 optimize.propagateEvent.emit('hidden');
                                 watchChangesOff();
                              }
                           }, trigger.interval);

                           scope.$on('$destroy', function () {
                              watchChangesOff();
                              $timeout.cancel(stopTimeout);
                           });
                        } else {
                           optimize.propagateEvent.emit('hidden');
                        }
                     }, trigger.delay);
                  };

                  angular.forEach(triggerElements, function (triggerElement) {
                     var $triggerElement = angular.element(triggerElement);

                     $triggerElement.off(trigger.event, applyOptimization)
                        .on(trigger.event, applyOptimization);

                     scope.$on('$destroy', function () {
                        $triggerElement.off(trigger.event, applyOptimization);
                     });
                  });

                  applyOptimization();
               };

               if (angular.isArray(settings.trigger)) {
                  angular.forEach(settings.trigger, bindTrigger);
               }
               else if (angular.isObject(settings.trigger)) {
                  bindTrigger(settings.trigger);
               }
            };

            bindTriggers();
         }
      };
   }

   function optimizeContentDirective($animate, $compile) {
      return {
         restrict: 'A',
         require: '^^optimize',
         scope: {
            optimizeContent: '=optimizeContent'
         },
         multiElement: true,
         transclude: 'element', //We will optimize whole element and it's content
         priority: 600,         //The same as ngIf has
         terminal: true,
         link: function (scope, element, attrs, ctrl, transclude) {
            var optimize = ctrl;
            var block, childScope, previousElements;

            //TODO: in materializecss modal-close classes close modal on click, but after recompiling it's not working
            var rebuildView = function (value) {

               if (value === 'compiled') {
                  if (!childScope) {
                     transclude(function (clone, newScope) {
                        childScope = newScope;
                        clone[clone.length++] = $compile.$$createComment('end optimizeContent', scope.optimizeContent);

                        block = {
                           clone: clone
                        };
                        $animate.enter(clone, element.parent(), element);
                     });
                  }
               } else {
                  if (previousElements) {
                     previousElements.remove();
                     previousElements = null;
                  }
                  if (childScope) {
                     childScope.$destroy();
                     childScope = null;
                  }
                  if (block) {
                     previousElements = getBlockNodes(block.clone);
                     $animate.leave(previousElements).then(function () {
                        previousElements = null;
                     });
                     block = null;
                  }
               }
            };

            var updateContent = function (value) {
               scope.optimizeContent = value;
               rebuildView(value);
            };

            optimize.propagateEvent.on(updateContent);

            scope.$on('$destroy', function () {
               optimize.destroy();
            });
         }
      };
   }
})
(angular);