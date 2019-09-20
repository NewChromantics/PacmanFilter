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

let Map = 
[
	"XXXXXXXXXXXXXXX",
	"X. . . . . . .X",
	"X. . . . . . .X",
	"X. . . . . . .X",
	"X. . . P . . .X",
	"X. . . . . . .X",
	"X. . . . . . .X",
	"XXXXXXXXXXXXXXX",
];
const MAP_WIDTH = 10;
const MAP_HEIGHT = 10;


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

	Diagnostics.watch('Pitch',face.cameraTransform.rotationX);
	Diagnostics.watch('Yaw',face.cameraTransform.rotationY);
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
	
	const UpPitch = -20;
	const DownPitch = -5;
	const LeftYaw = -5;
	const RightYaw = 5;
Pop.Debug(LastPitch);
	if ( LastPitch < UpPitch )
		return DIR_NORTH;
	if ( LastPitch > DownPitch )
		return DIR_SOUTH;
	if ( LastYaw < LeftYaw )
		return DIR_WEST;
	if ( LastYaw > RightYaw )
		return DIR_EAST;
	
	return DIR_NONE;
}

function PacmanGame()
{
	//	init from map
	this.Pacman = new Sprite( [4,4],'Actor_Pacman');

	this.UpdateSprite = function(Sprite)
	{
		let NewPos = Math.Add2( Sprite.Position, DIR_DELTA[Sprite.Direction] );

		//	check collision
		NewPos[0] = Math.clamp( 0, MAP_WIDTH, NewPos[0] );
		NewPos[1] = Math.clamp( 0, MAP_HEIGHT, NewPos[1] );

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
			x = Math.lerp( -0.1, 0.1, x );
			y = Math.lerp( 0.1, -0.1, y );

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
