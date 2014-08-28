(function () {
    angular.module('Game', ['FactoryMod', 'CheckersMod', 'FieldMod'])
        .controller('GameController', ['$scope', '$http', '$window', 'checkers', 'field', 'menFactory', function ($scope, $http, $window, checkersObj, field, factory) {
            var checkers = checkersObj.checkers;
            var socket = io();

            $scope.myTurn = false;
            $scope.scoreWhite = 0;
            $scope.scoreBlack = 0;
            $scope.tips = true;
            $scope.gameWinner = false;

            field.load();

            var getGameInfo = function () {
                $http.get('/getGameInfo').success(function (data) {
                    $scope.playerColor = $scope.playerColor || data.playersColor; //the color of checkers this user gonna play

                    //if the both white and black checkers had been occupiend before this user connected
                    if(!$scope.playerColor) {
                        $window.location.href = '/no-slots';
                    }

                    //if the both options are true or if the both options are false
                    if (($scope.playerColor == 'white') === data.whiteMoves) {
                        $scope.myTurn = true;
                    }

                    var white = 0,
                        black = 0; //score

                    if (data.checkers && data.checkers.length) {
                        //reload checkers positions
                        for (var i = 0, l = data.checkers.length; i < l; i++) {
                            (data.checkers[i].color == 'white') ? white++ : black++;
                            checkers[i].isOn = data.checkers[i].isOn;
                            checkers[i].type = data.checkers[i].type;
                            checkers[i].color = data.checkers[i].color;
                            checkers[i].colorCoef = data.checkers[i].colorCoef;
                        }
                        //delete killed checkers
                        checkers.splice(i);
                        $scope.scoreWhite = 12 - black; //killed amount of checkers equals default amount minus currently alive amount
                        $scope.scoreBlack = 12 - white;
                    }

                    field.setCheckers(checkers);
                    $scope.fields = field.fields;
                    if ($scope.scoreWhite == 12) {
                        $scope.gameWinner = 'White';
                    }
                    if ($scope.scoreBlack == 12) {
                        $scope.gameWinner = 'Black';
                    }
                    checkersObj.loadMoves($scope.fields, $scope.playerColor);

                }).error(function () {
                    console.log('Error getting game data');
                });
            };

            //show won-message if another player disconnects
            socket.on('enemy disconnected', function (curConnections) {
                if (curConnections < 2) {//if less than 2 players left in this game
                    $window.location.href = '/enemy-disconnected';
                }
            });

            socket.on ('moved', function () {
                //if it was our move, simply set myTurn to false, we have all the data
                if ($scope.myTurn) {
                    $scope.myTurn = false;
                } else {//else get game info
                    getGameInfo();
                }
            });

            getGameInfo();

            var active = null; //currently active cell;

            var resetActive = function (activeMan) {
                if (active) {//if there was any active field
                    activeMan = activeMan || $scope.fields[active].man;
                    $scope.fields[active].selected = "";

                    //unmark fields from canBit.moves array of the selected checker
                    for (var i = 0, l = activeMan.canBit.moves.length; i < l; i++) {
                        $scope.fields[activeMan.canBit.moves[i]].canMove = "";
                    }
                    //unmark fields from canMove array of the selected checker
                    for (var i = 0, l = activeMan.canMove.length; i < l; i++) {
                        $scope.fields[activeMan.canMove[i]].canMove = "";
                    }

                    active = null;
                }
            };

            $scope.isSelected = function (field, id) {
                //if a user clicks his checker, make a corresponding cell active and make inactive a previous one if there was any
                if (field.man && field.man.color === $scope.playerColor) {
                    resetActive();
                    //make the selected field active
                    active = id;
                    field.selected = "selected";

                    //mark fields from canBit.moves array of the selected checker
                    for (var i = 0, l = field.man.canBit.moves.length; i < l; i++) {
                        $scope.fields[field.man.canBit.moves[i]].canMove = "canMoveChain";
                    }
                    //mark fields from canMove array of the selected checker
                    for (var i = 0, l = field.man.canMove.length; i < l; i++) {
                        $scope.fields[field.man.canMove[i]].canMove = "canMoveFinal";
                    }

                    return;
                }
                //if a user clicks an empty cell and he previously clicked some checker (active is not null)
                if (!field.man && active) {
                    //check if the active cell can move there
                    if ($scope.fields[active].man.canMove.indexOf(id) >= 0) {
                        //process a move
                        var buf = active; //a buffer variable, active needs to be cleaned
                        resetActive($scope.fields[active].man);
                        var killed = $scope.fields[buf].man.canBit.killed; //checkers that the current checker killed this move
                        //if it killed somebody, the dead ones should be deleted
                        if (killed.length) {
                            //we need to sort the array desciding since we should start removing from the end of the array (greater index)
                            killed.sort(function(a, b){return b-a});
                            for (var i = 0, l = killed.length; i < l; i++) {
                                //getting the ID of the checker which is currently at this killed fields
                                for (var j = 0, ll = checkers.length; j<ll; j++) {
                                    if (checkers[j].isOn === killed[i]) {
                                        break;
                                    }
                                }
                                checkers.splice(j, 1);
                                $scope.fields[killed[i]].man = null;

                                ($scope.playerColor == 'white') ? $scope.scoreWhite++ : $scope.scoreBlack++;
                            }
                        }



                        //if we are about to become a king-checker
                        if (id < 8 && $scope.playerColor === 'white' || id >55 && $scope.playerColor === 'black') {
                            for (var i = 0, l = checkers.length; i<l; i++) {
                                if (checkers[i].isOn === buf) {
                                    break;
                                }
                            }
                            //removing this checker and adding a king
                            checkers.splice(i, 1);
                            checkers.push(new factory.KingChecker($scope.playerColor, buf));
                            $scope.fields[buf].man = checkers[checkers.length - 1];
                        }

                        field.man = $scope.fields[buf].man;
                        field.man.isOn = id;
                        $scope.fields[buf].man = null;

                        if ($scope.scoreWhite == 12) {
                            $scope.gameWinner = 'White';
                        }
                        if ($scope.scoreBlack == 12) {
                            $scope.gameWinner = 'Black';
                        }


                        //pass data to server
                        $http.put('/moved', {
                            checkers: checkers,
                            fields: $scope.fields
                        });
                    }
                }
                //reset active cell if not quited the function previously
                resetActive();
            }

        }])
        .directive('cells', function () {
            return {
                restrict: 'E',
                template: '<div ng-repeat="field in fields" ng-click="isSelected(field, $index)" class="{{field.color}} {{field.man.type}}-{{field.man.color}} {{field.selected}}" ng-class="{true: field.canMove}[tips]"></div>'
            }
        });


})();