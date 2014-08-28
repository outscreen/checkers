(function () {
    angular.module ('CheckersMod', ['FactoryMod'])
        .factory ('checkers', ['menFactory', function (factory) {
        var checkers = []; //array of checkers


        //adding white checkers; at the beginning of the game they are located at the bottom of the field
        for (var y = 5; y < 8; y++) {
            for (var x = 0; x < 8; x++) {
                if ((x + y) % 2) { //all the checkers are located at black cells
                    checkers.push(new factory.Cheсker ('white', y * 8 + x));
                }
            }
        }

        //adding black checkers; at the beginning of the game they are located at the top of the field
        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 8; x++) {
                if ((x + y) % 2) { //all the checkers are located at black cells
                    checkers.push(new factory.Cheсker ('black', y * 8 + x));
                }
            }
        }

        var possibleToBit = false; //if any of the checker can bit an opponent's one

        //calculate canMove and canBit for each checker
        var loadMoves = function (fields, playerColor) {
            possibleToBit = false;
            for (var i = 0, l = this.checkers.length; i < l; i++) {
                if (this.checkers[i].color === playerColor) {//we need to calculate moves only for the player's checkers
                    this.checkers[i].canMoveCount(fields, possibleToBit);
                    if (this.checkers[i].canBit.moves.length) {
                        possibleToBit = true;
                    }
                }
            }
            /*
            if possibleToBit is true (there are checkers that can bit), we need to make sure canMove arrays contain only
            the values present in canBit.moves since if any of our checkers can bit, we must bit
            */
            if (possibleToBit) {
                for (var i = 0, l = this.checkers.length; i < l; i++) {
                    for (var j = this.checkers[i].canMove.length, ll = 0; j >= ll; j--) { //we go reverse since we need to remove items
                        if (this.checkers[i].canBit.moves.indexOf(this.checkers[i].canMove[j]) < 0) {
                            //if the value from canMove is not present in canBit - delete it
                            this.checkers[i].canMove.splice(j, 1);
                        }
                    }
                }
            }
        };


        return {
            checkers: checkers,
            loadMoves: loadMoves
        };
    }])
})();