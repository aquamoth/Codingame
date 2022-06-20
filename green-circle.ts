//#region CodinGame API
let _readline_indexer = 0
const _readline_commands = [
    'MOVE',
    '11',
    'APPLICATION 16 0 0 4 0 0 0 4 0',
    'APPLICATION 15 0 0 4 0 0 4 0 0',
    'APPLICATION 17 0 0 4 0 0 0 0 4',
    'APPLICATION 26 0 0 0 0 0 4 0 4',
    'APPLICATION 4 4 0 0 0 0 4 0 0',
    'APPLICATION 27 0 0 0 0 0 0 4 4',
    'APPLICATION 20 0 0 0 4 0 0 4 0',
    'APPLICATION 3 4 0 0 0 4 0 0 0',
    'APPLICATION 6 4 0 0 0 0 0 0 4',
    'APPLICATION 1 4 0 4 0 0 0 0 0',
    'APPLICATION 8 0 4 0 4 0 0 0 0',
    '1 1 0 1',
    '0 0 2 0',
    '4',
    'HAND 1 1 3 0 0 0 0 0 0 0',
    'DRAW 0 0 0 0 0 0 0 0 3 2',
    'DISCARD 3 1 0 1 1 0 0 0 4 4',
    'OPPONENT_CARDS 0 0 0 0 0 0 1 0 2 6',
    '8',
    'MOVE 2',
    'MOVE 3',
    'MOVE 4',
    'MOVE 5',
    'MOVE 6',
    'MOVE 7',
    'MOVE 0',
    'RANDOM',
]
export function readline() {
    return _readline_commands[_readline_indexer++];
}
//#endregion



function readlineDEBUG() {
    const line = readline();
    console.error(`'${line}',`)
    return line
}




interface Dictionary<T> {
    [id: string]: T
}

enum Desk {
    training,
    coding,
    dailyRoutine,
    taskPrioritization,
    architectureStudy,
    continuousDelivery,
    codeReview,
    refactoring
}

enum CardLocation {
    HAND = 'HAND',
    DRAW = 'DRAW',
    DISCARD = 'DISCARD',
    OPPONENT_CARDS = 'OPPONENT_CARDS',
    // AUTOMATED = 'AUTOMATED',
    // OPPONENT_AUTOMATED = 'OPPONENT_AUTOMATED'
}

// enum CardType {
//     training = 'training',
//     coding = 'coding',
//     dailyRoutine = 'dailyRoutine',
//     taskPrioritization = 'taskPrioritization',
//     architectureStudy = 'architectureStudy',
//     continuousDelivery = 'continuousDelivery',
//     codeReview = 'codeReview',
//     refactoring = 'refactoring'
// }
enum CardType {
    training,
    coding,
    dailyRoutine,
    taskPrioritization,
    architectureStudy,
    continuousDelivery,
    codeReview,
    refactoring,
    bonus,
    technicalDept
}

type CardScore = { count: number, score: number }
type CardScores = { [id in keyof typeof CardType]: CardScore }
type CardLocations = { [location in keyof typeof CardLocation]: CardScores }

interface CardInfo {
    training: number;
    coding: number;
    dailyRoutine: number;
    taskPrioritization: number;
    architectureStudy: number;
    continuousDelivery: number;
    codeReview: number;
    refactoring: number;
}

interface Application {
    objectType: string;
    id: number;
    cards: { [location in keyof typeof Desk]: number }
}
interface ScoredApp extends Application {
    score: number
}

type Player = {
    location: number;
    score: number;
    permanentDailyRoutineCards: number;
    permanentArchitectureStudyCards: number;
}

type MoveCommand = {
    verb: 'MOVE',
    text: string,
    desk: Desk,
    card: Desk
}
type ReleaseCommand = {
    verb: 'RELEASE',
    text: string,
    app: number
}
type UnsupportedCommand = {
    verb: string,
    text: string
}
type Command = MoveCommand | ReleaseCommand | UnsupportedCommand;

class Game {
    private isFirstRun = true;
    private gamePhase: string;
    private applications: Application[];
    private players: Player[];
    private cards: CardLocations;
    private commands: Command[];

    private appToRelease: ScoredApp = null;

    public step() {

        this.parseInputs();

        if (this.isFirstRun) {
            //TODO: Do first-run preparations here
            this.isFirstRun = false;
        }

        switch (this.gamePhase) {
            case 'MOVE':
                this.processMove();
                break;

            case 'PLAY_CARD':
                console.error('PLAY_CARD is not implemented yet. Doing a random action')
                console.log('RANDOM')
                break;

            case 'RELEASE':
                this.processRelease();
                break;

            default:
                console.error('NOT SUPPORTED PHASE', this.gamePhase);
                console.log('RANDOM');
                break;
        }
    }

    private processMove() {

        // function createDeskMap(moves: string[]) {
        //     const deskMap: { [desk: number]: boolean } = {}
        //     const deskNumbers = moves.filter(move => move.startsWith('MOVE ')).map(move => +move.substring(5));
        //     for (const desk of deskNumbers) deskMap[desk] = true;
        //     // console.error('Available desks', deskMap);
        //     return deskMap;
        // }

        // function buildLocationsToAvoid(myLocation, opponentLocation) {
        //     const desks = []
        //     if (myLocation !== -1) desks.push(my.location);
        //     if (opponentLocation !== -1) {
        //         desks.push(opponentLocation)
        //         desks.push((opponentLocation + 1) % 8)
        //         desks.push((opponentLocation - 1 + 8) % 8)
        //     }
        //     return desks
        // }

        this.appToRelease = null;

        const my = this.players[0];
        const opponent = this.players[1];
        const myHand = this.cards[CardLocation[CardLocation.HAND]];
        // const deskMap = createDeskMap(this.moves);
        // const locationsToAvoid = buildLocationsToAvoid(my.location, opponent.location)


        // const bestDesks = Game.sortDesksByCardNeed(this.applications);

        const moves = this.commands.filter(isOfTypeMove);


        const penaltyLocations = opponent.location === -1
            ? []
            : [
                opponent.location,
                (opponent.location + 1) % 8,
                (opponent.location - 1 + 8) % 8,
            ];

        const scoredApps = Game.scoreApps(this.applications, myHand)
            .sort(sortAppsByScore);


        let appIndex = 0;
        let usefulMoves: MoveCommand[] = [];
        let consideredMoves: MoveCommand[] = [];
        while (consideredMoves.length === 0 && appIndex < scoredApps.length) {
            const bestApps = scoredApps.filter(app => app.score === scoredApps[appIndex].score);
    
            const usefulCards = bestApps.flatMap(app => 
                Array.from(
                    Object.entries(app.cards)
                        .filter(kvp => kvp[1] > 0)
                        .map(kvp => kvp[0] as keyof typeof Desk)
                    )
                )
                .map(deskName => Desk[deskName]);
                
            usefulMoves = moves.filter(move => usefulCards.some(card => card === move.card))
            consideredMoves = filterPenaltyMoves(usefulMoves, opponent.location);

            appIndex += bestApps.length;
        }

        if (!consideredMoves) {
            //TODO: Find the best apps shortest move before accepting any move
            //TODO: Consider evaluating moves by other criteria than release
            consideredMoves = moves;
            console.error('Not found any useful moves. Choosing among all moves.')
        }
        console.error('considered moves', consideredMoves)

        if (my.location >= 0) {
            consideredMoves.sort((a, b) => distanceTo(a.desk, my.location) - distanceTo(b.desk, my.location));
            console.error('Sorted moves', consideredMoves)
        }
        
        const chosenMove = consideredMoves[0];
        console.log(chosenMove.text);
        
        
        function distanceTo(desk: Desk, location: number) {
            return (desk - location + 8) % 8;
        }
        
        function isOfTypeMove(command: Command): command is MoveCommand { return command.verb === 'MOVE'; }

        function sortAppsByScore(prev: ScoredApp, next: ScoredApp) {
            return prev.score < next.score ? -1 : 1;
        }

        function filterPenaltyMoves(moves: MoveCommand[], deskIndex: number){
            if (deskIndex<0)
                return moves;
                
            return moves
                .filter(move => move.desk !== deskIndex)
                .filter(move => move.desk !== (deskIndex + 1) % 8)
                .filter(move => move.desk !== (deskIndex - 1 + 8) % 8);
        }
    }

    static sortDesksByCardNeed(applications: Application[]): Desk[] {
        const bestDesks = Object.keys(Desk)
            .filter(desk => isNaN(Number(desk)))
            .map(desk => desk as unknown as Desk)
            .map(desk => ({
                desk,
                count: applications.map(app => (app.cards[desk])).reduce((prev, next) => prev + next)
            }))
            .sort((a, b) => a.count > b.count ? -1 : 1);
        console.error('Best desks', bestDesks)
        return bestDesks.map(x => x.desk)
    }
    // static calcCardNeeds(applications: Application[]) : CardInfo{

    //     //Find most used card
    //     const initial : CardInfo = { 
    //         architectureStudy:0, 
    //         codeReview: 0,
    //         coding:0,
    //         continuousDelivery: 0,
    //         dailyRoutine: 0,
    //         refactoring: 0,
    //         taskPrioritization: 0,
    //         training: 0,
    //     };


    //     const neededCards = applications.reduce((prev, next)=>({
    //         architectureStudy: prev.architectureStudy + next.cards.architectureStudy,
    //         codeReview: prev.codeReview + next.cards.codeReview,
    //         coding: prev.coding + next.cards.coding,
    //         continuousDelivery: prev.continuousDelivery + next.cards.continuousDelivery,
    //         dailyRoutine: prev.dailyRoutine + next.cards.dailyRoutine,
    //         refactoring: prev.refactoring + next.cards.refactoring,
    //         taskPrioritization: prev.taskPrioritization + next.cards.taskPrioritization,
    //         training: prev.training + next.cards.training
    //     }), initial);

    //     return neededCards;
    // }


    static scoreApps(apps: Application[], myHand: CardScores): ScoredApp[] {
        return applyHandToApps(apps, myHand)
            .map(app => ({
                ...app,
                score: scoreApp(app) - myHand.bonus.score
            }))


        function applyHandToApps(apps: Application[], myHand: CardScores): Application[] {
            return apps.map(app => reduceApp(app, myHand));

            function reduceApp(app: Application, hand: CardScores): Application {
                return {
                    objectType: app.objectType,
                    id: app.id,
                    cards: {
                        architectureStudy: Math.max(0, app.cards.architectureStudy - hand.architectureStudy.score),
                        codeReview: Math.max(0, app.cards.codeReview - hand.codeReview.score),
                        coding: Math.max(0, app.cards.coding - hand.coding.score),
                        continuousDelivery: Math.max(0, app.cards.continuousDelivery - hand.continuousDelivery.score),
                        dailyRoutine: Math.max(0, app.cards.dailyRoutine - hand.dailyRoutine.score),
                        refactoring: Math.max(0, app.cards.refactoring - hand.refactoring.score),
                        taskPrioritization: Math.max(0, app.cards.taskPrioritization - hand.taskPrioritization.score),
                        training: Math.max(0, app.cards.training - hand.training.score)
                    }
                }
            }
        }

        function scoreApp(app: Application): number {
            return Object.values(app.cards).reduce((prev, next) => prev + next);
        }
    }

    private processRelease() {
        console.error('Processing RELEASE');

        if (this.appToRelease) {
            console.error('Previous phase already decided to release', this.appToRelease)
            console.log('RELEASE ' + this.appToRelease.id);
            this.appToRelease = null;
        }
        else {


            const MAX_ACCEPTABLE_TECHDEPT = 2;

            const myHand = this.cards[CardLocation[CardLocation.HAND]];
            // const scoredApps = this.applications.map(app => ({app, score: scoreApp(app, myHand)}));
            const scoredApps = Game.scoreApps(this.applications, myHand);
    
            const bestApp = scoredApps.reduce((prev, next) => prev.score < next.score ? prev : next);
    
            const shoddyPoints = Object.values(myHand).map(x => x.score).reduce((prev, next) => prev + next);
            console.error('best app', bestApp, shoddyPoints);
    
            if (bestApp.score <= MAX_ACCEPTABLE_TECHDEPT && shoddyPoints >= bestApp.score) {
                console.log('RELEASE ' + bestApp.id);
            }
            else {
                console.log('WAIT');
            }

        }
    }


    private parseInputs() {
        this.gamePhase = readlineDEBUG(); // can be MOVE, GIVE_CARD, THROW_CARD, PLAY_CARD or RELEASE
        this.applications = this.parseApps();
        this.players = this.parsePlayers();
        this.cards = this.parseCardLocations();
        this.commands = this.parseMoves();
    }

    private parseApps(): Application[] {
        const apps: Application[] = [];
        const applicationsCount = parseInt(readlineDEBUG());
        for (let i = 0; i < applicationsCount; i++) {
            var inputs = readlineDEBUG().split(' ');
            const app = this.parseApp(inputs);
            apps.push(app);
        }
        return apps;
    }

    private parseApp(inputs: string[]): Application {
        const objectType = inputs[0];
        const id = parseInt(inputs[1]);
        const training = parseInt(inputs[2]); // number of TRAINING skills needed to release this application
        const coding = parseInt(inputs[3]); // number of CODING skills needed to release this application
        const dailyRoutine = parseInt(inputs[4]); // number of DAILY_ROUTINE skills needed to release this application
        const taskPrioritization = parseInt(inputs[5]); // number of TASK_PRIORITIZATION skills needed to release this application
        const architectureStudy = parseInt(inputs[6]); // number of ARCHITECTURE_STUDY skills needed to release this application
        const continuousDelivery = parseInt(inputs[7]); // number of CONTINUOUS_DELIVERY skills needed to release this application
        const codeReview = parseInt(inputs[8]); // number of CODE_REVIEW skills needed to release this application
        const refactoring = parseInt(inputs[9]); // number of REFACTORING skills needed to release this application

        return {
            objectType,
            id,
            cards: {
                training,
                coding,
                dailyRoutine,
                taskPrioritization,
                architectureStudy,
                continuousDelivery,
                codeReview,
                refactoring
            }
        }
    }

    private parsePlayers() {
        const players: Player[] = [];
        for (let i = 0; i < 2; i++) {
            var inputs = readlineDEBUG().split(' ');
            const location = parseInt(inputs[0]); // id of the zone in which the player is located
            const score = parseInt(inputs[1]);
            const permanentDailyRoutineCards = parseInt(inputs[2]); // number of DAILY_ROUTINE the player has played. It allows them to take cards from the adjacent zones
            const permanentArchitectureStudyCards = parseInt(inputs[3]); // number of ARCHITECTURE_STUDY the player has played. It allows them to draw more cards
            players.push({
                location,
                score,
                permanentDailyRoutineCards,
                permanentArchitectureStudyCards
            })
        }
        return players;
    }

    private parseCardLocations(): { [location in keyof typeof CardLocation]: CardScores }/*Dictionary<CardScores>*/ {
        const cardLocations = {};//: {[location in keyof typeof CardLocation]: CardScores}

        const cardLocationsCount = parseInt(readlineDEBUG());
        for (let i = 0; i < cardLocationsCount; i++) {
            var inputs = readlineDEBUG().split(' ');
            const location: CardLocation = CardLocation[inputs[0]]; // the location of the card list. It can be HAND, DRAW, DISCARD or OPPONENT_CARDS (AUTOMATED and OPPONENT_AUTOMATED will appear in later leagues)
            const training = parseInt(inputs[1]);
            const coding = parseInt(inputs[2]);
            const dailyRoutine = parseInt(inputs[3]);
            const taskPrioritization = parseInt(inputs[4]);
            const architectureStudy = parseInt(inputs[5]);
            const continuousDelivery = parseInt(inputs[6]);
            const codeReview = parseInt(inputs[7]);
            const refactoring = parseInt(inputs[8]);
            const bonus = parseInt(inputs[9]);
            const technicalDebt = parseInt(inputs[10]);

            const cards: Dictionary<CardScore> = {
                ['training']: { count: training, score: training * 2 },
                ['coding']: { count: coding, score: coding * 2 },
                ['dailyRoutine']: { count: dailyRoutine, score: dailyRoutine * 2 },
                ['taskPrioritization']: { count: taskPrioritization, score: taskPrioritization * 2 },
                ['architectureStudy']: { count: architectureStudy, score: architectureStudy * 2 },
                ['continuousDelivery']: { count: continuousDelivery, score: continuousDelivery * 2 },
                ['codeReview']: { count: codeReview, score: codeReview * 2 },
                ['refactoring']: { count: refactoring, score: refactoring * 2 },
                ['bonus']: { count: bonus, score: bonus },
                ['technicalDebt']: { count: technicalDebt, score: 0 }
            }

            cardLocations[location] = cards;
        }
        return cardLocations as CardLocations;
    }

    private parseMoves() {
        const moves: Command[] = [];
        const count = parseInt(readlineDEBUG());
        for (let i = 0; i < count; i++) {
            const text = readlineDEBUG();
            const parts = text.split(' ')
            switch (parts[0]) {
                case 'MOVE':
                    const desk = +parts[1] as Desk;
                    const card = parts.length > 2 ? +parts[2] as Desk : desk;
                    moves.push({ verb: parts[0], text, desk, card });
                    break;
                case 'RELEASE':
                    const app = +parts[1];
                    moves.push({ verb: parts[0], text, app });
                    break;
                default:
                    moves.push({ verb: parts[0], text });
                    break;
            }
        }
        return moves;
    }
}







const game = new Game();


/**
 * Complete the hackathon before your opponent by following the principles of Green IT
 **/

// game loop
while (true) {
    if(_readline_indexer >= _readline_commands.length) break;

    game.step();

    // Write an action using console.log()
    // To debug: console.error('Debug messages...');
    // In the first league: RANDOM | MOVE <zoneId> | RELEASE <applicationId> | WAIT; In later leagues: | GIVE <cardType> | THROW <cardType> | TRAINING | CODING | DAILY_ROUTINE | TASK_PRIORITIZATION <cardTypeToThrow> <cardTypeToTake> | ARCHITECTURE_STUDY | CONTINUOUS_DELIVERY <cardTypeToAutomate> | CODE_REVIEW | REFACTORING;
}
