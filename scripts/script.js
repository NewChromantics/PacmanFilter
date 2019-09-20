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


//  Popengine wrapper
var Pop = {}
Pop.Debug = Diagnostics.log;

var Math = {};
Math.Add2 = function(a,b)
{
	let x = a[0] + b[0];
	let y = a[1] + b[1];
	return [x,y];
}


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

function GetFaceDirection()
{
	const face = FaceTracking.face(1);
	if ( !face.isTracked )
	{
		Pop.Debug("Face not tracking");
		return DIR_NONE;
	}
	//Pop.Debug(face);
	const faceTransform = face.cameraTransform;
	const LastPitch = faceTransform.rotationX.pinLastValue();
	const LastYaw = faceTransform.rotationY.pinLastValue();
	const LastRoll = faceTransform.rotationZ.pinLastValue();
	Pop.Debug("LastPitch=" + LastPitch + " LastYaw=" + LastYaw + " LastRoll=" + LastRoll);

	return DIR_NONE;
}

function PacmanGame()
{
	//	init from map
	this.Pacman = new Sprite( [4,4],'Actor_Pacman');

	this.UpdateSprite = function(Sprite)
	{
		let NewPos = Math.Add2( Sprite.Position, DIR_DELTA[Sprite.Direction] );
		//	todo: check collision
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

			const WorldPos = Sprite.Position.map( x=>x*0.01 );

			const NewX = Sprite.Actor.transform.y.mul(0).add(WorldPos[0]).pinLastValue();
			const NewY = Sprite.Actor.transform.y.mul(0).add(WorldPos[1]).pinLastValue();
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
const Timer = Time.setInterval( UpdateLoop, 1000/30 );
