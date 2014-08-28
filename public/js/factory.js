(function () {

    angular.module('FactoryMod', [])
        .factory('menFactory', function () {
            return factory;
        });


    var inherit = function (Child, Parent) {
        var constructor = Child.prototype.constructor,
            func = function () {
            };
        func.prototype = Parent.prototype;
        Child.prototype = new func();
        Child.prototype.constructor = constructor;
    };

    var factory = {
        Cheсker: function (color, isOn) {
            this.type = 'checker';
            this.color = color;
            (color === 'white') ? this.colorCoef = -1 : this.colorCoef = 1;
            this.isOn = isOn;
            this.maxMove = 1;
        },
        KingChecker: function (color, isOn) {
            this.type = 'king';
            this.color = color;
            (color === 'white') ? this.colorCoef = -1 : this.colorCoef = 1;
            this.isOn = isOn;
            this.maxMove = 7;
        }
    };

    factory.Cheсker.prototype = {
        color: null,
        colorCoef: null, //this coefficient will correspond to the direction where a man can move: white move up (-1 : y--), black move down (+1: y++)
        canBit: {//the fields which the man can bit
            moves: [], //IDs of the fields a man walks through when bits enemies
            killed: [] //IDs of the fields where killed enemies where located
        },
        canMove: [], //the fields where the man can move
        isOn: null, //index of the field the man is on
        move: function (toField) {
            if (this.canMove.indexOf(toField) >= 0) {
                this.isOn = toField;
            }
        },
        getXY: function (isOn) { //calculates x:y coordinates based on the index of the field
            var x, y;
            x = parseInt(isOn) % 8;
            y = (parseInt(isOn) - x) / 8;
            return {
                x: x,
                y: y
            };
        },
        getFieldId: function (position) {//calculates a field ID based on the field's coordinates
            return position.y * 8 + position.x;
        },

        canBitCount: function (fields, isOn, n) {
            var curPosition = this.getXY(isOn), //current position: object with X and Y properties which correspond to x:y coordinates
                self = this;

            var calculate = function (directionX, directionY, self) {
                var enemyPosition,
                    newPosition; //a field where you should move if you bit an enemy

                enemyPosition = {
                    x: curPosition.x + directionX,
                    y: curPosition.y + directionY
                };

                //if a probable enemy position exists and is occupied by a man (is not empty) and this man is an enemy (a man with a different color) and we have not killed this enemy for now
                if (enemyPosition.x >= 0 && enemyPosition.x < 8 && enemyPosition.y >= 0 && enemyPosition.y < 8 && fields[self.getFieldId(enemyPosition)].man && fields[self.getFieldId(enemyPosition)].man.color != self.color && self.canBit.killed.indexOf(self.getFieldId(enemyPosition)) < 0) {
                    newPosition = {
                        x: enemyPosition.x + directionX / Math.abs(directionX),
                        y: enemyPosition.y + directionY / Math.abs(directionY)
                    };
                    //if this field exists and is not occupied
                    if (newPosition.x >= 0 && newPosition.x < 8 && newPosition.y >= 0 && newPosition.y < 8 && !fields[self.getFieldId(newPosition)].man) {
                        //add the ID of  new position filed to canBit.moves and the ID of the killed enemy field to canBit.killed
                        self.canBit.moves.push(self.getFieldId(newPosition));
                        self.canBit.killed.push(self.getFieldId(enemyPosition));
                        //since checkers can bit several enemies in chain, we need to use recursion can call the function with a new position

                        self.canBitCount(fields, self.getFieldId(newPosition), n);
                        return;
                    } else {
                        return 'bad direction'; //if there is an occupied or invalid field, return 'bad direction'
                    }

                } else {
                    return 'bad direction'; //if there is an occupied or invalid field, return 'bad direction'
                }
            };

            for (var i = 1; i <= n; i++) {
                if (calculate(i, i, self) === 'bad direction') {//stop moving this direction
                    break;
                };
            }
            for (var i = 1; i <= n; i++) {
                if (calculate(i, -i, self) === 'bad direction') {//stop moving this direction
                    break;
                };
            }
            for (var i = 1; i <= n; i++) {
                if (calculate(-i, i, self) === 'bad direction') {//stop moving this direction
                    break;
                };
            }
            for (var i = 1; i <= n; i++) {
                if (calculate(-i, -i, self) === 'bad direction') {//stop moving this direction
                    break;
                };
            }




            /*
             if we are here, it means that the function was not called again this time and the current chain is over
             so we are free to add the last field in a chain (current position) to possible moves array.
             ONLY if the current position is not the initial one and if the current position is not a part of another more successful chain
             (a part cannot be the last one. if isOn is the last one in canBit.moves, it is the end of the current chain)
             */

            if (isOn != this.isOn && (this.canBit.moves.indexOf(isOn) < 0 || this.canBit.moves.indexOf(isOn) === this.canBit.moves.length-1)) {
                //debugger;
                this.canMove.push(isOn);
                return;
            }

        },

        canMoveCount: function (fields, possibleToBit) {
            this.canMove = [];
            this.canBit = {
                moves: [],
                killed: []
            };
            this.canBitCount(fields, this.isOn, this.maxMove);
            /*if any checker can bit an opponent, you must do this, you cannot simply move.
             if the current checker can bit anyone (canMove was filled in at canBitCount), we do not need to add
             more moves to canMove, the checker cannot go there, it must bit
             if possibleToBit is true (other checkers can bit), we need to stop here as well even if canMove is empty
             since in this case we will have to move the checkers that can bit
             */
            if (possibleToBit || this.canMove.length) {
                return;
            }

            var curPosition = this.getXY(this.isOn), //current position: object with X and Y properties which correspond to x:y coordinates
                self = this;

            var calculate = function (directionX, directionY, self) {
                var newPosition;
                newPosition = {
                    x: curPosition.x + directionX,
                    y: curPosition.y + directionY
                };
                //if a probable position exists and is not occupied by a man add it to possible moves
                if (newPosition.x >= 0 && newPosition.x < 8 && newPosition.y >= 0 && newPosition.y < 8 && !fields[self.getFieldId(newPosition)].man) {
                    self.canMove.push(self.getFieldId(newPosition));
                }
            };

            if (this.type == 'checker') {
                calculate(1, this.colorCoef, self);
                calculate(-1, this.colorCoef, self);
            } else {
                for (var i = 1; i <= this.maxMove; i++) {//if it is a kingchecker
                    calculate(i, i, self);
                    calculate(i, -i, self);
                    calculate(-i, i, self);
                    calculate(-i, -i, self);
                }
            }

        }
    }

    inherit(factory.KingChecker, factory.Cheсker);

})();


