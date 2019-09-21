//==============================================================================
// Welcome to scripting in Spark AR Studio! Helpful links:
//
// Scripting Basics - https://fb.me/spark-scripting-basics
// Reactive Programming - https://fb.me/spark-reactive-programming
// Scripting Object Reference - https://fb.me/spark-scripting-reference
// Changelogs - https://fb.me/spark-changelog
//==============================================================================

// How to load in modules
const Diagnostics = require('Diagnostics');
const Scene = require('Scene');
const Animation = require('Animation');
const Time = require('Time');
const FaceTracking = require('FaceTracking');
const Reactive = require('Reactive');


//  Popengine wrapper
var Pop = {}
Pop.Debug = Diagnostics.log;

var Math = {};
Math.PI = Math.PI || 3.141592653589793;

Math.max = function(a,b)	{	return (a>b) ? a : b;	}
Math.min = function(a,b)	{	return (a<b) ? a : b;	}

Math.Add2 = function(a,b)
{
	let x = a[0] + b[0];
	let y = a[1] + b[1];
	return [x,y];
}

Math.RadToDeg = function(Radians)
{
	return Radians * (180 / Math.PI);
}

Math.clamp = function(min, max,Value)
{
	return Math.min( Math.max(Value, min), max);
}

Math.range = function(Min,Max,Value)
{
	return (Max==Min) ? 0 : (Value-Min) / (Max-Min);
}
Math.Range = Math.range;

Math.rangeClamped = function(Min,Max,Value)
{
	return Math.clamp( 0, 1, Math.range( Min, Max, Value ) );
}
Math.RangeClamped = Math.rangeClamped;

Math.lerp = function(Min,Max,Time)
{
	return Min + (( Max - Min ) * Time);
}
Math.Lerp = Math.lerp;

String.prototype.replaceAt = function(index, replacement) 
{
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

let Map = 
[
	"XXXXXXXXXXX",
	"X. . . . .X",
	"X OOO OOO X",
	"X O. . .O X",
	"X. .O O. .X",
	"XOO O O XXX",
	"X. . P . .X",
	"X O XXX O X",
	"X.O.O O.O.X",
	"X O   O O X",
	"X O   O O X",
	"X.O.O O.O.X",
	"X O OOO O X",
	"X. . . . .X",
	"XOO O O OOX",
	"X. .O O. .X",
	"X.O     O X",
	"X OOO OOO X",
	"X. . . . PX",
	"XXXXXXXXXXX"
];
const EnableCollisions = false;
const MAP_WIDTH = Map[0].length;
const MAP_HEIGHT = Map.length;
const MAP_OWALL = 'X';
const MAP_IWALL = EnableCollisions ? 'O' : '$';
const MAP_PILL = '.';
const MAP_PLAYER = 'P';
const MAP_NONE = ' ';

const DIR_NONE = 0;
const DIR_NORTH = 1;
const DIR_SOUTH = 2;
const DIR_EAST = 3;
const DIR_WEST = 4;
const DIR_DELTA = {};
DIR_DELTA[DIR_NONE] = [0,0];
DIR_DELTA[DIR_NORTH] = [0,-1];
DIR_DELTA[DIR_SOUTH] = [0,1];
DIR_DELTA[DIR_EAST] = [1,0];
DIR_DELTA[DIR_WEST] = [-1,0];

function GetMapStartPos()
{
	for ( let y=0;	y<Map.length;	y++ )
	{
		const Row = Map[y];
		for ( let x=0;	x<Row.length;	x++ )
		{
			const MapElement = Row[x];
			if ( MapElement == MAP_PLAYER )
				return [x,y];
		}
	}
	return [1,1];
}

function IsWall(MapPosition)
{
	const x = MapPosition[0];
	const y = MapPosition[1];
	const Element = Map[y][x];
	return Element == MAP_IWALL || Element == MAP_OWALL;
}

function PopPill(MapPosition)
{
	const x = MapPosition[0];
	const y = MapPosition[1];
	const Element = Map[y][x];
	if ( Element != MAP_PILL )
		return false;
	Map[y].replaceAt(x,MAP_NONE);
	return true;
}

function Sprite(StartPosition,ActorName)
{
	this.Position = StartPosition.slice();
	this.Direction = DIR_NONE;
	this.Actor = Scene.root.find(ActorName);
}


var LastFaceRotation = 
{
	'Pitch':0,
	'Yaw':0,
	'Roll':0
};

function InitFace()
{
	const face = FaceTracking.face(0);
	const OnNewFaceRotationX = function(Event)	{	LastFaceRotation.Pitch = Event.newValue;	};
	const OnNewFaceRotationY = function(Event)	{	LastFaceRotation.Yaw = Event.newValue;	};
	const OnNewFaceRotationZ = function(Event)	{	LastFaceRotation.Roll = Event.newValue;	};
	face.cameraTransform.rotationX.monitor().subscribe( OnNewFaceRotationX );
	face.cameraTransform.rotationY.monitor().subscribe( OnNewFaceRotationY );
	face.cameraTransform.rotationZ.monitor().subscribe( OnNewFaceRotationZ );

	//Diagnostics.watch('Pitch',face.cameraTransform.rotationX);
	//Diagnostics.watch('Yaw',face.cameraTransform.rotationY);
}
InitFace();

function GetFaceDirection()
{
	const face = FaceTracking.face(0);

	if ( !face.isTracked )
	{
		Pop.Debug("Face not tracking");
		return DIR_NONE;
	}

	const LastPitch = Math.RadToDeg( LastFaceRotation.Pitch );
	const LastYaw = Math.RadToDeg( LastFaceRotation.Yaw );
	
	const UpPitch = -15;
	const DownPitch = 1;
	const LeftYaw = -8;
	const RightYaw = 8;
	//Pop.Debug("pitch="+LastPitch);
	
	if ( LastYaw < LeftYaw )		{	Pop.Debug("LastYaw="+LastYaw);	return DIR_WEST;	}
	if ( LastYaw > RightYaw )		{	Pop.Debug("LastYaw="+LastYaw);	return DIR_EAST;	}
	if ( LastPitch < UpPitch )		{	Pop.Debug("pitch="+LastPitch);	return DIR_NORTH;	}
	if ( LastPitch > DownPitch )	{	Pop.Debug("pitch="+LastPitch);	return DIR_SOUTH;	}
	
	return DIR_NONE;
}


var Score = 0;
function IncreaseScore()
{
	Scene.root.find('ScoreText');

}

function PacmanGame()
{
	//	init from map
	this.Pacman = new Sprite( GetMapStartPos(),'Actor_Pacman');

	this.UpdateSprite = function(Sprite)
	{
		let NewPos = Math.Add2( Sprite.Position, DIR_DELTA[Sprite.Direction] );

		//	move only if we didnt hit a wall
		if ( IsWall(NewPos) )
			return;

		if ( PopPill(NewPos) )
			IncreaseScore();
			
		Sprite.Position = NewPos;
	}

	this.Update = function()
    {
		//Pop.Debug("Update");
		//	check for new input
		this.Pacman.Direction = GetFaceDirection();

		//	move sprites around
		this.UpdateSprite( this.Pacman );

		//	update graphics
		this.UpdateActors();
	}
	

	this.UpdateActors = function()
	{
		const UpdateActor = function(Sprite)
		{
			/*
			const OrigY = Sprite.Actor.transform.y.pinLastValue();
			const NewY = Sprite.Actor.transform.y.add(100).pinLastValue();

			const timeDriver = Animation.timeDriver({durationMilliseconds: 1,loopCount:1,mirror:false});
			let linearSampler = Animation.samplers.linear(OrigY,NewY);
			Sprite.Actor.transform.y = Animation.animate(timeDriver,linearSampler);
			timeDriver.start();
			*/

			let x = Math.range( 0, MAP_WIDTH, Sprite.Position[0] );
			let y = Math.range( 0, MAP_HEIGHT, Sprite.Position[1] );
			const WorldWidth = 1.35;
			const WorldHeight = 2.0;
			x = Math.lerp( -WorldWidth, WorldWidth, x );
			y = Math.lerp( WorldHeight, -WorldHeight, y );

			//const NewX = Sprite.Actor.transform.y.mul(0).add(WorldPos[0]).pinLastValue();
			//const NewY = Sprite.Actor.transform.y.mul(0).add(WorldPos[1]).pinLastValue();
			const NewX = Reactive.val(x);
			const NewY = Reactive.val(y);
			//Pop.Debug(NewX);
			//Pop.Debug(NewY);
			//Pop.Debug(Sprite.Actor.transform);
			Sprite.Actor.transform.x = NewX;
			Sprite.Actor.transform.y = NewY;
/*
			function GetNumberSignal(Value)
			{
				const Sampler = Animation.samplers.linear(Value, Value);
				const Driver = Animation.valueDriver(value: ScalarSignal, min: number, max: number): ValueDriver
				const scaleAnimation = Animation.animate(Driver, Sampler);
			}
			Sprite.Actor.transform.y = GetNumberSignal(Sprite.Position[1]);

			

			//let Pos = new Point3D( Sprite.Position[0], Sprite.Position[1], 0 );
			//	convert sprite pos to world pos
			//Sprite.Actor.transform.x = Sprite.Position[0];
			let y = Sprite.Actor.transform.y.mul(0).add(Sprite.Position[1]);
			Sprite.Actor.transform.y = y;
			Pop.Debug(y);
			//Sprite.Actor.transform.y = y;
			//Sprite.Actor.transform.y = Sprite.Position[1];
			//Pop.Debug(Sprite.Actor.transform.x);
			//	update anim
			*/
		}
		UpdateActor( this.Pacman );
	}
}

var Game = new PacmanGame();

//  create update loop
function UpdateLoop()
{
	Game.Update();
}
const FramesPerSec = 10;
const Timer = Time.setInterval( UpdateLoop, 1000/FramesPerSec );
