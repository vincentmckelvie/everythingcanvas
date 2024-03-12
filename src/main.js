
import * as THREE from './build/three.module.js';
import { GLTFLoader } from './scripts/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from './scripts/jsm/exporters/GLTFExporter.js';
import { OrbitControls } from './scripts/jsm/controls/OrbitControls2.js';
import { RoomEnvironment } from './scripts/jsm/environments/RoomEnvironment.js';
import { BrushHelper } from './BrushHelper.js';
import { Stroke } from './Stroke.js';
import { ActionHelper } from './ActionHelper.js';
import { Background } from './Background.js';
import { CustomMaterial } from './CustomMaterial.js';
import { TransformControls } from './scripts/jsm/controls/TransformControls.js';
//import { TWEEN } from './scripts/jsm/libs/tween.module.min.js';

const appVer=1;

let camera, mesh, scene, renderer;
let mouse = {
    position: new THREE.Vector2(), 
    previousNormal: new THREE.Vector2(), 
    previous: new THREE.Vector2(), 
    avgs:[], 
    smoothAvgs:[],
    normal: new THREE.Vector2(), 
    down:false,
    smoothInc:0,
    smoothLerp:new THREE.Vector3(),
    rots:[],
    scales:[],
    scatterInfo:[]
};

let loadedObject, strokesLoopHelper=0;
let canTogglStrokeSelect = true;
let hoverTimeout;
let strokeSelect = false;
let usingCustomDrawObject = false;
let world, meshBody, joint;
let bodies=[], visuals=[];
let dt = 1 / 60;
let raycaster, intersected;
let point, holding = false, constrainedBody, mouseConstraint, currentZ = 0.0, bgMesh, scenePosition = new THREE.Vector3();
let ot = false, tempGeo, yInc = 0;
let canvas, ctx;
let geoArr = [];
let yOff = 0.1;
let object;
let globalAnimationSpeed = 1;
let light;
let composer;
let controls;
let bgHolder;
let btns={space:true, fullThumbs:false};
let sceneMesh;
let shouldRotateAdditiveX = true;
let shouldRotateAdditiveY = true;
let shouldRotateAdditiveZ = true;
let globalAdditiveRotationSpeed = 0;
let mouseOverSelect = false;
let mouseOverTools = false;

let globalShouldAnimateSize = true;

const renderCanv = document.createElement("canvas");
const renderCtx = renderCanv.getContext("2d");
        
let canLoadMesh = true;

const loadobjs = [
    //{name:"draw objects", url:"./extras/draw/",           amount:2},
    {loaded:false, key:"1", name:"Simple Shapes", url:"./extras/models/simple-shapes/", amount:7},
    {loaded:false, key:"2", name:"Animals", url:"./extras/models/everything-animals/", amount:231},
    {loaded:false, key:"3", name:"Consumables", url:"./extras/models/everything-consumables/", amount:107},
    {loaded:false, key:"4", name:"Furnishings", url:"./extras/models/everything-furnishings/", amount:231},
    {loaded:false, key:"5", name:"Microscopic", url:"./extras/models/everything-microscopic/", amount:226},
    {loaded:false, key:"6", name:"Plants", url:"./extras/models/everything-plants/", amount:486},
    {loaded:false, key:"7", name:"Underwater", url:"./extras/models/everything-underwater/", amount:107},
    {loaded:false, key:"8", name:"Trees", url:"./extras/models/everything-trees/", amount:273},
    {loaded:false, key:"9", name:"Rocks", url:"./extras/models/everything-rocks/", amount:465},
    {loaded:false, key:"0", name:"Human", url:"./extras/models/everything-human/", amount:330},
    {loaded:false, key:"u", name:"Vehicles", url:"./extras/models/everything-vehicles/", amount:83},
    {loaded:false, key:"i", name:"Buildings", url:"./extras/models/everything-buildings/", amount:213},
    {loaded:false, key:"o", name:"Zeometry", url:"./extras/models/everything-geo/", amount:297},
    {loaded:false, key:"p", name:"Space", url:"./extras/models/everything-space/", amount:265},
    
]
//let colorAniSpeed = 
let currDragImgSrc;
let drawObject;  
let drawState = "both" 
let showingSideBar = true;
let movingCamera = false;
let scatterPressed = false;
let scatterChecked = false;
let scatterMode = false;
let rndScale = 0;
let rndPosition = 0;
let scatterIndexBefore = 0;
let scatterIndexAfter = 0;

let meshScale = 1;
let penSense = 1;
let shouldDoPenPressure = true;
let currentDrawHitPoint;
let globalOffsetRotation = new THREE.Euler( 0, 0, 0, 'XYZ' );
let globalLerpAmount = 1;

let globalDensityAmount = .062;
let globalSmoothAmount = .1;
let globalNormalOffsetAmount = .05;
let previewMesh;
let clock;
let rotationFollowsNormal = true;
let helper;
let helperLocation;
let helperRotation;
let targetQuat = new THREE.Quaternion();

let mirrorX = true;
let mirrorY = false;
let mirrorZ = false;

let mirrorMeshX;
let mirrorMeshY;
let mirrorMeshZ;
let showedStrokeSelectError = false;
let currentDrawObjectIndex = 0;

let strokeHolder = new THREE.Object3D();
let reflectObjectX = new THREE.Object3D();
let reflectObjectY = new THREE.Object3D();
let reflectObjectZ = new THREE.Object3D();
let reflectObjectXY = new THREE.Object3D();
let reflectObjectXZ = new THREE.Object3D();
let reflectObjectYZ = new THREE.Object3D();
let reflectObjectXYZ = new THREE.Object3D();

let background;
const matHandler = new CustomMaterial();;
let urlIndex = 0;
let modelIndex = 0;
const paintMeshes = [];
//let strokeSelectStrokes = [];
let transformControls;
let movingTransformControls = false;
const actionHelper = new ActionHelper();
let currentSelectedStrokeIndex = -1;
let isFullscreen = false;
let selectedThumbDiv;
let downloadModelIndex = 0;
let downloadUrlIndex = 0;
let showingContext = false;
let scatterArray = [];
let scatterSelectPressed = false;
let scatterSelectActive = false;

function mobileCheck() {
    //console.log(navigator.userAgent.match())
    //return navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone|iPad|iPod/i) || navigator.userAgent.match(/Opera Mini/i) || navigator.userAgent.match(/IEMobile/i);
    //return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // This checks if the current device is in fact mobile
        return true;
    }
    return false;
    
    
};

const isMobile = mobileCheck();
const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

init();

function init(){
    
    for(let i = 0; i<loadobjs.length; i++){
        const amt = loadobjs[i].amount; 
        const dHolder = document.createElement("div");
        const dTitle = document.createElement("div");
        const dImgs = document.createElement("div");
        
        document.getElementById("models").append(dHolder);
        dHolder.className="drop-down-holder-brushes";
        dHolder.id = "title-"+ loadobjs[i].name.replace(/\s/g, '-');
        //if(dHolder.id)
        dTitle.className="drop-down-title";
        dImgs.className="drop-down-content";
        dImgs.id = "content-" + loadobjs[i].name.replace(/\s/g, '-');
        dTitle.innerHTML = loadobjs[i].name + " [" +loadobjs[i].key+ "]";
        dHolder.append(dTitle);
        dHolder.append(dImgs);

        $(dTitle).click(function(){
            if ( $( dImgs ).first().is( ":hidden" ) ) {
                const lo = loadobjs[i]; 
                if(!lo.loaded){
                    lo.loaded = true;
                    const a = lo.amount;
                    for(let k = 0; k<a; k++){
                        const url = lo.url;
                        const div = document.createElement("div");
                        const img = document.createElement("img");
                        img.className="brush-thumb";
                        div.className="thumb-holder";
                        
                        if(isMobile)
                            img.classList.add("mobile-brush-thumb");
                        
                        img.src = (url+k)+".png";
                        div.onclick = function(){
                            if(canLoadMesh){
                                handleIconClick(div,i,k);
                            
                                // if(!scatterSelectPressed){
                                    
                                //     scatterArray=[];
                                //     updateScatterDom();
                                //     scatterArray.push({modelIndex:k, urlIndex:i});
                                //     chooseModel(i,k);
                                //     selectedThumbDiv.classList.remove("selected-thumb")
                                //     div.classList.add("selected-thumb");
                                //     selectedThumbDiv = div;

                                // }else {
                                //     const 
                                //     scatterArray.push({modelIndex:k, urlIndex:i})
                                //     updateScatterDom();
                                // }

                            }
                        };
                        
                        div.onmousedown = function(e){ currDragImgSrc = e.srcElement.currentSrc; };
                        img.oncontextmenu = function(e){

                            e.preventDefault();
                            downloadUrlIndex = i;
                            downloadModelIndex = k;
                            showingContext = true;

                            $("#contextMenu").fadeIn("fast");
                            $("#contextMenu").css("top", e.clientY+"px")
                            $("#contextMenu").css("left", e.clientX+"px")
                        }
                        
                        //img.onmousedown = function(e){currDragImgSrc = e.srcElement.currentSrc;};
                        div.append(img);
                        dImgs.append(div);
                    }
                }
                $( dImgs ).slideDown();
            } else {
                $( dImgs ).slideUp();
            }
        })
        

        if(i==0){
            $(dImgs).slideDown();
            loadobjs[i].loaded = true;
            for(let k = 0; k<amt; k++){
                const url = loadobjs[i].url;
                const div = document.createElement("div");
                let img = document.createElement("img")
                img.className="brush-thumb";
                div.className="thumb-holder";
                
                if(k==0){
                    div.classList.add("selected-thumb");
                    selectedThumbDiv = div;
                }

                if(isMobile)
                    img.classList.add("mobile-brush-thumb");                    
                
                img.src = (url+k)+".png";
                div.onclick = function(){
                    if(canLoadMesh){
                        handleIconClick(div,i,k);
                    }
                };
                div.onmousedown = function(e){ currDragImgSrc = e.srcElement.currentSrc; };
                img.oncontextmenu = function(e){
                    e.preventDefault();
                    downloadUrlIndex = i;
                    downloadModelIndex = k;
                    showingContext = true;
                    $("#contextMenu").fadeIn("fast");
                    $("#contextMenu").css("top", e.clientY+"px")
                    $("#contextMenu").css("left", e.clientX+"px")
                                 
                }
                div.append(img);
                dImgs.append(div);
            }
        }
    }
    
   
    chooseModel(0,0);
    scatterArray.push({modelIndex:0, urlIndex:0});

    const loader = new GLTFLoader().setPath("./extras/draw/" );
    currentDrawObjectIndex=Math.floor(Math.random()*10);
    loader.load( currentDrawObjectIndex+'.glb', function ( gltf ) {
        gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material.vertexColors = false;
            }
        });
        drawObject = gltf.scene;
        scene.add(gltf.scene)
        
        
    });

    canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.id="draw-canvas"
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    canvas.className = "customCanvas";
    
	raycaster = new THREE.Raycaster();

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 20;

	scene = new THREE.Scene();

    reflectObjectX.scale.x =-1;

    reflectObjectY.scale.y =-1;

    reflectObjectZ.scale.z =-1;
    
    reflectObjectXY.scale.y =-1;
    reflectObjectXY.scale.x =-1;
    
    reflectObjectXZ.scale.z =-1;
    reflectObjectXZ.scale.x =-1;

    //reflectObjectYZ.scale.x =-1;
    reflectObjectYZ.scale.y =-1;
    reflectObjectYZ.scale.z =-1;

    reflectObjectXYZ.scale.x =-1;
    reflectObjectXYZ.scale.y =-1;
    reflectObjectXYZ.scale.z =-1;

    strokeHolder.name = "strokeHolder";
    reflectObjectX.name = "reflectObjectX";
    reflectObjectY.name = "reflectObjectY";
    reflectObjectZ.name = "reflectObjectZ";
    reflectObjectXY.name = "reflectObjectXY";
    reflectObjectXZ.name = "reflectObjectXZ";
    reflectObjectYZ.name = "reflectObjectYZ";
    reflectObjectXYZ.name = "reflectObjectXYZ";
    
    scene.add(strokeHolder)
    strokeHolder.add(
        reflectObjectX,
        reflectObjectY,
        reflectObjectZ,
        reflectObjectXY,
        reflectObjectXZ,
        reflectObjectYZ,
        reflectObjectXYZ,
    );
    // scene.add(reflectObjectY);
    // scene.add(reflectObjectZ);
    // scene.add(reflectObjectXY);
    // scene.add(reflectObjectXZ);
    
    object = new THREE.Object3D();
    scene.add(object);
    
    bgHolder = new THREE.Object3D();
    scene.add(bgHolder)

    //camera.add(bgHolder);
    bgHolder.position.copy(camera.position);
    bgHolder.rotation.copy(camera.rotation);
    const mirrorMeshSze = .03;
    mirrorMeshX = new THREE.Mesh(new THREE.BoxGeometry(mirrorMeshSze, 2000, mirrorMeshSze), new THREE.MeshBasicMaterial({depthTest :true, color:0xff0000}))
    mirrorMeshX.visible = mirrorX;
    scene.add(mirrorMeshX)

    mirrorMeshY = new THREE.Mesh(new THREE.BoxGeometry(2000, mirrorMeshSze, mirrorMeshSze), new THREE.MeshBasicMaterial({depthTest :true, color:0x00ff00}))
    mirrorMeshY.visible = mirrorY;
    scene.add(mirrorMeshY)

    mirrorMeshZ = new THREE.Mesh(new THREE.BoxGeometry(mirrorMeshSze, mirrorMeshSze, 2000), new THREE.MeshBasicMaterial({depthTest :true, color:0x0000ff}))
    mirrorMeshZ.visible = mirrorZ;
    scene.add(mirrorMeshZ)
    // sceneMesh = new THREE.Mesh(
    //     new THREE.SphereBufferGeometry( 5, 32, 32 ),
    //     new THREE.MeshNormalMaterial( {color: 0xffff00} )
    // )
    // scene.add(sceneMesh);
    
	const g = new THREE.PlaneGeometry( 10000, 10000, 1, 1);
    const t = new THREE.TextureLoader().load( './extras/grid.png' );
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat = new THREE.Vector2(10000,10000);
    const m = new THREE.MeshBasicMaterial( { color: 0x2d69a9, transparent:true, alphaMap:t, side:THREE.DoubleSide, opacity:0.5 } );
    m.blending = THREE.AdditiveBlending;
	bgMesh = new THREE.Mesh( g, m);
    bgMesh.visible = true;
    bgHolder.add(bgMesh);
    bgHolder.position.set(camera.position.z,0,0);
    bgMesh.position.z = -camera.position.z;
    
	// lights
    const light = new THREE.AmbientLight( 0x242424 ); // soft white light
    scene.add( light );

    const dlight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    var d = 20;
    dlight.position.set( d*.5, 0, d );

    scene.add(dlight)
    
	renderer = new THREE.WebGLRenderer({antialias:true});
	//renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = .5;  
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
    renderer.domElement.className = "customThree";
    renderer.domElement.id = "three-dom";

    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.14 ).texture;

    controls = new OrbitControls( camera, canvas);
    
    controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.zoomSpeed = .4
    controls.rotateSpeed = .6;
    controls.panSpeed = .6;
    
    //controls.screenSpacePanning = false;

    controls.minDistance = .5;
    controls.maxDistance = 250;

    controls.enableRotate = false;
    controls.enablePan = false;
    //controls.screenSpacePanning = false;
    
    clock = new THREE.Clock();

    transformControls = new TransformControls( camera, canvas );
    transformControls.size = .75;
    
    transformControls.space = 'world';
    transformControls.addEventListener( 'mouseDown', () => {movingTransformControls = true; controls.enabled = false;});
    transformControls.addEventListener( 'mouseUp', () => {movingTransformControls = false; controls.enabled = true;} );
    scene.add( transformControls );

    // function killTransform(){
    //     transformControls.removeEventListener( 'mouseDown', () => orbitControls.enabled = false );
    //     transformControls.removeEventListener( 'mouseUp', () => orbitControls.enabled = true );
    // }



    for(let i = 0; i<11; i++){
        
        document.getElementById("draw-object-"+i).addEventListener("click", function(){
            
            if(i!=currentDrawObjectIndex){
                usingCustomDrawObject = false;
                currentDrawObjectIndex = i;
                //console.log(currentDrawObjectIndex);
                replaceDrawObject("./extras/draw/"+i+".glb");
            }
            
        });

    }

    const dds = [
        "export",
        "draw-object",
        "essentials",
        "scatter",
        "mirror",
        "rotation",
        "background",
        "shader-effects"
    ]

    for(let i = 0; i<dds.length; i++){
        const t = document.getElementById(dds[i]+"-title");
        
        t.addEventListener( "click", function(){

            const el = "#"+dds[i]+"-content";
            if ( $( el ).first().is( ":hidden" ) ) {
                $( el ).slideDown( );
            } else {
                $( el ).slideUp();
            }
            
        })
    }
    
    if(isMobile){

        //controls.enableZoom = false;
        document.getElementById("mobile-controls").style.display = "block";
        
        document.getElementById("mobile-rotate").addEventListener("pointerdown", mobileRotateDown)
        document.getElementById("mobile-rotate").addEventListener("pointerup", mobileRotateUp)
        document.getElementById("mobile-rotate").addEventListener('dragleave', mobileRotateUp);

        document.getElementById("mobile-pan").addEventListener("pointerdown", mobilePanDown)
        document.getElementById("mobile-pan").addEventListener("pointerup", mobilePanUp)
        document.getElementById("mobile-pan").addEventListener('dragleave', mobilePanUp);

        // document.getElementById("mobile-zoom").addEventListener("pointerdown", mobileZoomDown)
        // document.getElementById("mobile-zoom").addEventListener("pointerup", mobileZoomUp)

        document.getElementById("mobile-eye").addEventListener("pointerdown", mobileEyeDown)
        const arr = document.getElementsByClassName('mobile-icons');
        for(let i = 0; i<arr.length; i++){
            
            arr[i].setAttribute('draggable', false);
            arr[i].ondragstart = function() { return false; };

        }
        //$("#show-instructions").remove();   
        //document.getElementById("tools-holder").classList.add("holders-mobile");
        //document.getElementById("select").classList.add("holders-mobile");
         
        
    }

   
    window.addEventListener('focus', onFocus );
    window.addEventListener('blur', onBlur );

	window.addEventListener( 'resize', onWindowResize, false );
    
    window.addEventListener( 'keydown', onKeyDown, false );
    window.addEventListener( 'keyup', onKeyUp, false );
    
    //document.addEventListener( 'touchmove', onTouchMove, false );
    if(!isMobile){
	   document.addEventListener( 'pointermove', onMouseMove, false );
       canvas.addEventListener( 'pointerdown', onMouseDown, false );
       $("#instructions-holder").fadeIn();
    }else{
        document.addEventListener( 'touchmove', onMouseMove, false );
        canvas.addEventListener( 'touchstart', onMouseDown, false );
        $("#instructions-holder-mobile").fadeIn();  
    }
    
    canvas.addEventListener( 'pointerup', onMouseUp, false );
    
    document.getElementById("reset-cam").addEventListener("click", resetCam);

    document.getElementById("show-instructions").addEventListener("click", toggleInstructions);
    
    document.getElementById("got-it-btn").addEventListener("click", toggleInstructions);
    document.getElementById("got-it-mobile-btn").addEventListener("click", toggleInstructions);
    
    document.getElementById("instructions-overlay").addEventListener("click", toggleInstructions);
    
    document.getElementById("save-geo-ink-file").addEventListener("click", saveGeoInkFile)
    document.getElementById("stroke-select-toggle").addEventListener("click", toggleStrokeSelect)
    
    document.getElementById("toggle-draw-on-view").addEventListener("click", updateDrawState);
    document.getElementById("toggle-draw-object").addEventListener("click", toggleDrawObject);
    document.getElementById("export-gltf").addEventListener("click", exportGLTF);
    document.getElementById("rotation-follows-normal").addEventListener("click", toggleRotationFollowingNormal);
    document.getElementById("mirror-x").addEventListener("click", toggleMirrorX);
    document.getElementById("mirror-y").addEventListener("click", toggleMirrorY);
    document.getElementById("loop-gradient").addEventListener("click", updateModelParams);
    document.getElementById("mirror-z").addEventListener("click", toggleMirrorZ);
    document.getElementById("undo").addEventListener("click", undoClick);
    document.getElementById("redo").addEventListener("click", redoClick);

    document.getElementById("animation-speed-slider").addEventListener("input", updateAniSpeed);
    //updateScaleOffset

    document.getElementById("download-glb").addEventListener("click", downloadThumbGLB);
    
    document.getElementById("stroke-scale-offset").addEventListener("input", updateScaleOffset);

    document.getElementById("stroke-rot-offset-x").addEventListener("input", updateRotOffsetX);
    document.getElementById("stroke-rot-offset-y").addEventListener("input", updateRotOffsetY);
    document.getElementById("stroke-rot-offset-z").addEventListener("input", updateRotOffsetZ);
    
    
    document.getElementById("size-slider").addEventListener("input", updateMeshSize);
    
    document.getElementById("scatter-check").addEventListener("click", toggleScatter);
    // document.getElementById("brush-before-input").addEventListener("input", updateScatterBefore);
    // document.getElementById("brush-after-input").addEventListener("input", updateScatterAfter);
    
    document.getElementById("scatter-select").addEventListener("click", toggleScatterSelect);
    
    document.getElementById("rnd-scale").addEventListener("input", updateRndScale);
    document.getElementById("rnd-position").addEventListener("input", updateRndPosition);
    
    document.getElementById("should-size-ease-in-out").addEventListener("click", toggleSizeEasing);
    
    document.getElementById("rotate-slider-x").addEventListener("input", rotateBrushX);

    document.getElementById("rotate-slider-y").addEventListener("input", rotateBrushY);

    document.getElementById("rotate-slider-z").addEventListener("input", rotateBrushZ);

    document.getElementById("additive-rotation-slider").addEventListener("input", updateRotationSpeed);

    document.getElementById("additive-rotation-x").addEventListener("click", toggleAdditiveRotationX);
    document.getElementById("additive-rotation-y").addEventListener("click", toggleAdditiveRotationY);
    document.getElementById("additive-rotation-z").addEventListener("click", toggleAdditiveRotationZ);

    document.getElementById("smooth-amount").addEventListener("input", updateSmoothAmount);

    document.getElementById("normal-offset-amount").addEventListener("input", updateNormalOffsetAmount);

    document.getElementById("density-amount").addEventListener("input", updateDensity);

    document.getElementById("background-gradient-size").addEventListener("input", updateBackgroundParms);

    document.getElementById("background-gradient-offset").addEventListener("input", updateBackgroundParms);

    document.getElementById("background-color-top").addEventListener("input", updateBackgroundParms);

    document.getElementById("background-color-bottom").addEventListener("input", updateBackgroundParms);
    


    document.getElementById("rainbow-tint-amount").addEventListener("input", updateModelParams);

    document.getElementById("rainbow-size").addEventListener("input", updateModelParams);

    document.getElementById("model-gradient-size").addEventListener("input", updateModelParams);
    
    document.getElementById("model-gradient-angle").addEventListener("input", updateModelParams);

    document.getElementById("model-gradient-add").addEventListener("input", updateModelParams);
    
    document.getElementById("model-gradient-offset").addEventListener("input", updateModelParams);
    
    document.getElementById("model-color-top").addEventListener("input", updateModelParams);
   
    document.getElementById("model-color-bottom").addEventListener("input", updateModelParams);
   
    document.getElementById("noise-deform").addEventListener("input", updateModelParams);
   
    document.getElementById("noise-size").addEventListener("input", updateModelParams);
   
    document.getElementById("twist-deform").addEventListener("input", updateModelParams);
   
    document.getElementById("twist-size").addEventListener("input", updateModelParams);
   
    document.getElementById("deform-speed").addEventListener("input", updateModelParams);
  
    document.getElementById("color-speed").addEventListener("input", updateModelParams);
    
    document.getElementById("view-draw-color").addEventListener("input", updateViewColor);
    
    document.getElementById("draw-object-opacity").addEventListener("input", updateDrawObjectOpacity);
  
    document.getElementById("view-draw-distance").addEventListener("input", updateDrawViewDistanceSlider);
  
    document.getElementById("stroke-index-input").addEventListener("input", updateSelectedStroke)

    document.getElementById("render-download").addEventListener("click", handleRenderImg)
    
    $(window).bind('beforeunload', function(){
        return 'make sure to save an everything canvas file or glb before leaving.';
    });

    document.getElementById("stroke-move").addEventListener("click", toggleMoveGizmo)
    document.getElementById("stroke-rotate").addEventListener("click", toggleRotateGizmo)
    document.getElementById("stroke-scale").addEventListener("click", toggleScaleGizmo)
    document.getElementById("fullscreen").addEventListener("click", toggleFullscreen)
    document.getElementById("tools-holder").addEventListener("mousemove", onToolsHover)
    document.getElementById("select").addEventListener("mousemove", onThumbsHover)
    
    document.getElementById("stroke-delete").addEventListener("click", deleteStroke)
    
    canvas.addEventListener( 'dragover', onDocumentDragOver, false );
    canvas.addEventListener( 'dragleave', onDocumentLeave, false );
    canvas.addEventListener( 'drop', onDocumentDrop, false );

    document.getElementById("instructions-overlay").addEventListener( 'dragover', onInstructionsDragOver, false );
    //document.getElementById("instructions-overlay").addEventListener( 'dragleave', onDocumentLeave, false );
    //document.getElementById("instructions-overlay").addEventListener( 'drop', onDocumentDrop, false );

    //$("#splash-mobile, #splash").attr("src","./extras/splash-"+Math.floor(Math.random()*3)+".png")
    $("#splash-mobile, #splash").attr("src","./extras/pepe-gif.gif")

    helper = new BrushHelper({scene:scene, raycaster:raycaster});
    background = new Background({scene:scene});
    

	animate();
}


function handleIconClick(div,i,k){
    if(!scatterSelectPressed && !scatterSelectActive){

        scatterArray=[];
        updateScatterDom();
        scatterArray.push({modelIndex:k, urlIndex:i});

        selectedThumbDiv.classList.remove("selected-thumb");
        div.classList.add("selected-thumb");
        selectedThumbDiv = div;
        chooseModel(i,k);

    }else{
        if(scatterSelectActive){
            
            if(scatterArray.length == 1){
                scatterArray[0]={modelIndex:k, urlIndex:i};
                selectedThumbDiv.classList.remove("selected-thumb");
                div.classList.add("selected-thumb");
                selectedThumbDiv = div;
                chooseModel(i,k);
            }
        }

        const scatterArrayCheck = isModelInScatterArray({modelIndex:k, urlIndex:i});
        
        if(!scatterArrayCheck){
            scatterArray.push({modelIndex:k, urlIndex:i})    
        }else{
            scatterArray.splice(scatterArrayCheck, 1);
        }
        
        updateScatterDom();
    }
}


function isModelInScatterArray(OBJ){
    
    for(let i = 0; i<scatterArray.length; i++){
        if(scatterArray[i].urlIndex == OBJ.urlIndex && scatterArray[i].modelIndex==OBJ.modelIndex)
            return i;
    }

    return null;
}


// function updateScatterBefore(){
//     let val = $("#brush-before-input").val();
//     if ( !val || val == "" || val == " "){
//         val = 0;
//     }
//     scatterIndexBefore = Math.abs( parseFloat(val) );//$("#rnd-scale").value();
//     updateScatterDom(); 
// }

// function updateScatterAfter (){
//     let val = $("#brush-after-input").val();
//     if ( !val || val == "" || val == " "){
//         val = 0;
//     }

//     scatterIndexAfter = Math.abs( parseFloat(val) );
    
//     updateScatterDom();
// }


function updateScatterDom(){
    
    killAllSctterDom();
    initScatterDom();
    

}

function initScatterDom(){
    for(let i = 0; i<scatterArray.length; i++){
        const id = "content-"+loadobjs[scatterArray[i].urlIndex].name.replace(/\s/g, '-');
        const div = document.getElementById(id);
        div.children[scatterArray[i].modelIndex].classList.add("scatter");
        
    }
}
/*

function updateScatterDom(){
    
    killAllSctterDom();
    const id = "content-"+loadobjs[urlIndex].name.replace(/\s/g, '-');
    const div = document.getElementById(id);
    for(let i = 0; i < div.children.length; i++ ){
        const d = div.children[i];
        d.classList.remove("scatter");
        
        if(i != modelIndex){
           
            if(i >= modelIndex - scatterIndexBefore && i <= modelIndex + scatterIndexAfter){
               
                d.classList.add("scatter");
            }
        }
    }

}
*/
function killAllSctterDom(){
    for(let i = 0; i<loadobjs.length; i++){
        const id = "content-"+loadobjs[i].name.replace(/\s/g, '-');
        const div = document.getElementById(id);
        for(let k = 0; k < div.children.length; k++ ){
            const d = div.children[k];
            d.classList.remove("scatter");
        }
    }
}

function updateRndScale(){
    rndScale = $("#rnd-scale").val() *.02;
};

function updateRndPosition (){
    rndPosition = $("#rnd-position").val() * .05;    
};


function handleRenderImg(){
    helper.holder.visible = false;
    
    currentSelectedStrokeIndex = -1;
    transformControls.detach();
    
    const wasBgMeshVisible = bgMesh.visible; 
    bgMesh.visible = false;
    
    mirrorMeshX.visible = false; 
    mirrorMeshY.visible = false; 
    mirrorMeshZ.visible = false; 

    actionHelper.unHover();

    renderer.render(scene,camera);
    renderer.preserverDrawingBuffer = true;

    const durl =  document.getElementById("three-dom").toDataURL();// renderer.domElement.toDataURL();
    const image = new Image();
    image.onload = function(){

        renderCanv.width = window.innerWidth;
        renderCanv.height = window.innerHeight;
        
        renderCtx.drawImage(image, 0,0, renderCanv.width, renderCanv.height);
        renderCtx.font = "15px Arial";
        renderCtx.fillStyle = "white";
        renderCtx.textAlign = "right";
        renderCtx.fillText("everythingcanv.as", renderCanv.width-20, renderCanv.height-20);
        
        const link = document.createElement('a');
        link.download = 'everything-canvas.png';
        link.href = renderCanv.toDataURL()
        link.click();

        if(!strokeSelect)
            helper.holder.visible = true;

        if(mirrorX){
            mirrorMeshX.visible = true; 
        }
        if(mirrorY){
            mirrorMeshY.visible = true; 
        }
        if(mirrorZ){
            mirrorMeshZ.visible = true; 
        }
        
        bgMesh.visible = wasBgMeshVisible;
        renderer.preserverDrawingBuffer = false;

    }
    image.src = durl;
}


function killContext(){
    if(showingContext){
        $("#contextMenu").fadeOut("fast");
        showingContext = false;
    }
}

function downloadThumbGLB(){
    const ui = downloadUrlIndex;
    const mi = downloadModelIndex;
    const link = document.createElement('a');
    link.download = loadobjs[ui].name+"-"+mi+".glb";
    link.href = loadobjs[ui].url+""+mi+".glb";
    link.click();
    killContext();
     
}
function onThumbsHover(e){   
    mouseOverSelect = true;
    mouseOverTools = false;

    if(drawObject!=null && e.target.id!="normal-offset-amount"){
        handleUiUpdating();
    }

    //onToolsHover(e);
}
function onToolsHover(e){
    
    mouseOverTools = true;
    mouseOverSelect = false;

    killContext();
    if(drawObject!=null && e.target.id!="normal-offset-amount"){
        handleUiUpdating();
    }
}

function updateDrawViewDistanceSlider(){
   
    updateDrawViewDistance( $("#view-draw-distance").val() );
}

function updateDrawViewDistance(val){
    
    let v = Math.abs(val); 
    if(v<2)v=2;
    if(v>80)v=80;
    bgMesh.position.z = -v; 
}



function updateDrawObjectOpacity(){
    const o = $("#draw-object-opacity").val()*.01;
    //console.log(o)
    UpdateDrawObjectOpacity(o);
}
function updateViewColor(){
    bgMesh.material.color = new THREE.Color( $("#view-draw-color").val() )
}

function deleteStroke(){
    if(currentSelectedStrokeIndex != -1){
         
        actionHelper.deleteStrokeHelper(currentSelectedStrokeIndex);

        currentSelectedStrokeIndex = -1;
        transformControls.detach();
        
    }

}

function toggleMoveGizmo(){
    transformControls.setMode( 'translate' );
}
function toggleRotateGizmo(){
    transformControls.setMode( 'rotate' );
}
function toggleScaleGizmo(){
    transformControls.setMode( 'scale' );
}

function mobileEyeDown(e){
    toggleUI();
}

function mobileRotateDown(e){
    e.preventDefault();
    if(controls)controls.enableRotate = true;
}
function mobileRotateUp(e){
    e.preventDefault();
    if(controls)controls.enableRotate = false;
}
function mobilePanDown(e){
    e.preventDefault();
    if(controls)controls.enablePan = true;
}
function mobilePanUp(e){
    e.preventDefault();
    if(controls)controls.enablePan = false;
}

// function mobileZoomDown(e){
//     e.preventDefault();
//     if(controls)
//         controls.enableZoom = true;
// }
// function mobileZoomUp(e){
//     e.preventDefault();
//     if(controls)
//         controls.enableZoom = false;
// }

function toggleStrokeSelect(){

    strokeSelect = !strokeSelect;   
    if(strokeSelect && actionHelper.actionsArr.length==0 && !showedStrokeSelectError){
        alert("draw some strokes, then enter stroke select mode to select and edit them.");
        strokeSelect = false;
        showedStrokeSelectError = true;
    }

    const val = strokeSelect ? "draw mode":"stroke select";
    $("#stroke-select-toggle").html(val);
    helper.holder.visible = !strokeSelect;
    
    if(strokeSelect){
        $("#stroke-select-options").slideDown();
        $("#draw-mode-options").slideUp();
    }else{
        actionHelper.unHover();
        for(let i = 0; i<paintMeshes.length; i++){
            paintMeshes[i].model.traverse( function ( child ) {
                if ( child.isMesh ) {
                    child.material.emissive = new THREE.Color(0x000000);
                }
            });
        }
        currentSelectedStrokeIndex = -1;
        transformControls.detach();

        helper.copyMaterial({  param:getMatParam(), matHandler:matHandler });
        $("#draw-mode-options").slideDown();
        $("#stroke-select-options").slideUp();
    }
    
    actionHelper.unHover();
    
}

function updateSelectedStroke(){
    
    let val = $("#stroke-index-input").val();
    
    clearTimeout(hoverTimeout);

    //strokeSelectStrokes = [];
    currentSelectedStrokeIndex = -1;
    transformControls.detach();

    if(val=="" || val==null)val=0;
    
    if(val > actionHelper.currStrokeIndex-1)val = actionHelper.currStrokeIndex-1;
    $("#stroke-index-input").val(val);
    
    currentSelectedStrokeIndex = val;
    actionHelper.select(currentSelectedStrokeIndex, transformControls);
    updateStrokeSelectSlidersFromObject(actionHelper.actionsArr[currentSelectedStrokeIndex][0].stroke);

    //hoverStrokes();
    actionHelper.hover(currentSelectedStrokeIndex);
    hoverTimeout = setTimeout( function(){
        actionHelper.unHover();
    },300)
    //}

}

function updateBackgroundParms(){

    const top = $("#background-color-top").val();
    const bottom = $("#background-color-bottom").val();
    const size = $("#background-gradient-size").val()*.01;
    const offset = $("#background-gradient-offset").val();
    
    background.update({top:new THREE.Color(top), bottom:new THREE.Color(bottom), size:size, offset:offset})
}

function updateModelParams(){
    
    const param = getMatParam();
    
    if(strokeSelect){
      
        if(currentSelectedStrokeIndex != -1){
            actionHelper.updateMatParam(currentSelectedStrokeIndex, param);
        }

    }

    helper.holder.traverse( function ( child ) {
        if ( child.isMesh ) {
            if(child.material.userData.shader!=null){
                child.material.userData.shader.uniforms.twistAmt.value = param.twistAmt;
                child.material.userData.shader.uniforms.noiseSize.value = param.noiseSize;
                child.material.userData.shader.uniforms.twistSize.value = param.twistSize;
                child.material.userData.shader.uniforms.noiseAmt.value = param.noiseAmt;
                child.material.userData.shader.uniforms.rainbowAmt.value = param.rainbowAmt;
                child.material.userData.shader.uniforms.gradientSize.value = param.gradientSize;
                child.material.userData.shader.uniforms.gradientAngle.value = param.gradientAngle;
                child.material.userData.shader.uniforms.gradientAdd.value = param.gradientAdd;
                child.material.userData.shader.uniforms.rainbowGradientSize.value = param.rainbowGradientSize;
                child.material.userData.shader.uniforms.gradientOffset.value = param.gradientOffset;
                child.material.userData.shader.uniforms.topColor.value = param.topColor;
                child.material.userData.shader.uniforms.bottomColor.value = param.bottomColor;
                child.material.userData.shader.uniforms.deformSpeed.value = param.deformSpeed;
                child.material.userData.shader.uniforms.colorSpeed.value = param.colorSpeed;
                child.material.userData.shader.uniforms.shouldLoopGradient.value = param.shouldLoopGradient;
            }

        }

    });

       

} 
    

function animate(){
    requestAnimationFrame( animate );
    //TWEEN.update();
    if(controls)
        controls.update();

    scatterMode = scatterChecked || scatterPressed; 

    if(mouse.down){
        
        if(currentDrawHitPoint){
            
            
            if(mouse.smoothInc==0){
                mouse.smoothLerp.set(currentDrawHitPoint.x, currentDrawHitPoint.y, currentDrawHitPoint.z);
            }

            mouse.smoothLerp.lerp(currentDrawHitPoint,globalSmoothAmount);
            
            const rx = (-rndPosition*.5)+(Math.random()*rndPosition);
            const ry = (-rndPosition*.5)+(Math.random()*rndPosition);
            const rz = (-rndPosition*.5)+(Math.random()*rndPosition);

            mouse.smoothAvgs.push(new THREE.Vector3(mouse.smoothLerp.x+rx,mouse.smoothLerp.y+ry,mouse.smoothLerp.z+rz) )
            
            const targ = new THREE.Quaternion();
            helper.holder.getWorldQuaternion(targ);
            mouse.rots.push( targ );

            let s = (meshScale*penSense) + ( - ( rndScale * .5) + Math.random() * rndScale);
            if(s<0)s=0;
            mouse.scales.push( s );
            const scatterRnd = ( -Math.floor( Math.random() * (scatterIndexBefore + 1) ) ) + ( Math.floor( Math.random() * (scatterIndexAfter + 1) ) )  
            let mi = modelIndex + scatterRnd;
            
            if(mi<0)mi=0;
            if(mi>loadobjs[urlIndex].amount-1)mi=loadobjs[urlIndex].amount-1;
            const ui = urlIndex;
            const rnd = Math.floor( Math.random() * scatterArray.length );
            //mouse.scatterInfo.push({modelIndex:mi, urlIndex:ui})
            mouse.scatterInfo.push({modelIndex:scatterArray[rnd].modelIndex, urlIndex:scatterArray[rnd].urlIndex});
            
            mouse.smoothInc ++;
            
            // if(scatterMode){
            //     if(mouse.smoothAvgs.length > Math.floor( (.31 - globalDensityAmount) * 80) ){
                    
            //         //const total = Math.ceil( mouse.smoothAvgs.length * globalDensityAmount);

            //         for(let i = 0; i<mouse.smoothAvgs.length; i++){
            //             mouse.rots[i] = mouse.rots[0];
            //             mouse.scales[i] = mouse.scales[0];
            //             mouse.smoothAvgs[i] = mouse.smoothAvgs[0];
            //         }
                    
            //         buildGeo();
            //         helper.copyMaterial({  param:getMatParam(), matHandler:matHandler });
                    
            //         mouse.rots = [];
            //         mouse.scales = [];
            //         mouse.smoothAvgs = [];
            //         currentDrawHitPoint = null;
            //         mouse.smoothInc = 0;
            //         geoArr = [];
            //     }
            // }
            

        }

    }

    if(helper){
        helper.update({
            globalSmoothAmount:globalSmoothAmount,
            meshScale:meshScale, 
            globalSmoothAmount:globalSmoothAmount,
            shouldRotateAdditiveX:shouldRotateAdditiveX,
            shouldRotateAdditiveY:shouldRotateAdditiveY,
            shouldRotateAdditiveZ:shouldRotateAdditiveZ,
            globalAdditiveRotationSpeed:globalAdditiveRotationSpeed,
            globalOffsetRotation:globalOffsetRotation,
            rotationFollowsNormal:rotationFollowsNormal,
            drawing: mouse.down && currentDrawHitPoint,
            penSense:penSense
        });
    }
    
    bgHolder.position.copy(camera.position);
    bgHolder.rotation.copy(camera.rotation);

    const selectMult = strokeSelect?0:1;
    const d = clock.getDelta();
    const delta = d*globalAnimationSpeed*selectMult ;
  
    actionHelper.update({delta:delta})
    matHandler.update({delta:d})
    //composer.render();
    renderer.render(scene,camera);
	
}

function getMatParam(){
    
    const loop = $("#loop-gradient:checked").val() ? 1. : 0.0;
    
    return { 
        twistAmt:$("#twist-deform").val()*.03,
        noiseSize:$("#noise-size").val()*.04,
        twistSize:$("#twist-size").val()*.04,
        noiseAmt:$("#noise-deform").val()*.01,
        rainbowAmt:$("#rainbow-tint-amount").val()*.01,
        gradientSize:$("#model-gradient-size").val()*.01,
        gradientAngle:$("#model-gradient-angle").val()*.01,
        gradientAdd:$("#model-gradient-add").val()*.01,
        rainbowGradientSize:$("#rainbow-size").val()*.08,
        gradientOffset:+$("#model-gradient-offset").val()*.3,
        topColor:new THREE.Color( $("#model-color-top").val() ),
        bottomColor:new THREE.Color( $("#model-color-bottom").val() ),
        deformSpeed:$("#deform-speed").val()*.03,
        colorSpeed:$("#color-speed").val()*.03,
        shouldLoopGradient: loop
    }
}

function chooseModel(i,k, customParams, callback, version){
    
    killContext();
        
    urlIndex = i;
    modelIndex = k;

    updateScatterDom();       

    const ui = urlIndex;
    const mi = modelIndex;
    
    canLoadMesh = false;
    if(!hasLoadedMeshAlready()){
        const loader = new GLTFLoader().setPath( loadobjs[i].url );
        loader.load( k+'.glb', function ( gltf ) {
            if(version == null || version > 0)//version == null is just brush select and version > 0 is checking if loading a file 
                window.parseModel(gltf.scene);
            
            paintMeshes.push({urlIndex:ui, modelIndex:mi, model:gltf.scene});
            handleMeshLoad(gltf.scene, customParams, callback)
        });
    }else{
        const scene = getMeshFromIndex(urlIndex, modelIndex);
        handleMeshLoad(scene, customParams, callback)
    }   
   

}

window.parseModel = function(scene){
    //console.log("parse model");
    scene.traverse( function ( child ) {
        if ( child.isMesh ) {
            child.geometry.rotateX(Math.PI/2);
            child.geometry.computeBoundingBox();
        }
    });

    //scene.computeBoundingBox();
    var bbox = new THREE.Box3().setFromObject(scene);
    scene.traverse( function ( child ) {
        if ( child.isMesh ) {
            child.position.z -= bbox.min.z;
        }
    });
}

function getMeshFromIndex(ui, mi){
    for(let i = 0; i<paintMeshes.length; i++){
        if(ui == paintMeshes[i].urlIndex && mi == paintMeshes[i].modelIndex)
            return paintMeshes[i].model;
    }
}

function hasLoadedMeshAlready(){
    for(let i = 0; i<paintMeshes.length; i++){
        if(urlIndex == paintMeshes[i].urlIndex && modelIndex == paintMeshes[i].modelIndex)
            return true;
    }
    return false;
}

function handleMeshLoad(scene, customParams, callback){
    canLoadMesh = true;
    const param = customParams == null ? getMatParam() : customParams;

    scene.traverse( function ( child ) {
        if ( child.isMesh ) {
            child.material = matHandler.getCustomMaterial(child.material, param);
        }
    });

    helper.updateVisual({mesh:scene});
    
    if(strokeSelect){
        helper.holder.visible = false;
        const modelInfo = { modelIndex : modelIndex, urlIndex : urlIndex};
        if(currentSelectedStrokeIndex != -1){
            actionHelper.updateModelInfo(currentSelectedStrokeIndex, {scene:scene, modelInfo:modelInfo});    
        }
    }

    if(callback !=null ){
        callback(scene);
    }

}



function getModelByIndex(ui,mi){
    for(let i = 0; i<paintMeshes.length; i++){
        // console.log("ui = "+ui)
        // console.log("mi = "+mi)
        // console.log("model = ")
        // console.log(paintMeshes[i].model)
        // console.log("pmesh url index "+paintMeshes[i].urlIndex);
        // console.log("pmesh model index "+paintMeshes[i].modelIndex);
        if(ui == paintMeshes[i].urlIndex && mi == paintMeshes[i].modelIndex){
           // console.log("return")
            return paintMeshes[i].model;
        }
    }
}

function resetCam(){
    
    camera.position.set(0,0,20);
    camera.rotation.set(0,0,0);
    bgMesh.position.z=-camera.position.z;
    if(controls)
        controls.reset();
}



function getHitPointFromMesh(msh, mse){

	raycaster.setFromCamera(  mse, camera );
	
	var intersects = raycaster.intersectObjects( msh );

	if ( intersects.length > 0 ) {
		return { point:intersects[ 0 ].point, normal:intersects[ 0 ].face.normal};
	}
	
	return false;
}

function closeFullscreen(){
    document.exitFullscreen();
    isFullscreen = false;
    document.getElementById("fullscreen").innerHTML="fullscreen";
}

function openFullscreen(elem) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
    isFullscreen = true;
    document.getElementById("fullscreen").innerHTML="exit fullscreen"
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
    isFullscreen = true;
    document.getElementById("fullscreen").innerHTML="exit fullscreen"
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
    isFullscreen = true;
    document.getElementById("fullscreen").innerHTML="exit fullscreen"
  }
}

function toggleFullscreen(){
    if(!isFullscreen)
        openFullscreen(document.body);
    else
        closeFullscreen();
}



function onKeyDown(e) {
    if(e.keyCode ==83){
        scatterSelectPressed = true;   
    }
    if(e.keyCode==90 && !strokeSelect){
        scatterPressed = true;
        canTogglStrokeSelect = false;
    }

    if(e.keyCode==8||e.keyCode==46){
        deleteStroke();
    }

    if(e.keyCode==188){//negative
        globalDensityAmount -= .02;
        if(globalDensityAmount<0.0031)globalDensityAmount = 0.0031;
        $("#density-amount").val(globalDensityAmount/.0031)
    }

    if(e.keyCode==190){//positive
        globalDensityAmount += .02;
        if(globalDensityAmount>.31)globalDensityAmount = .31;
        $("#density-amount").val(globalDensityAmount/.0031)
    }

    if(e.keyCode==222){
        if(globalNormalOffsetAmount>2.)
            globalNormalOffsetAmount += .25;
        else if(globalNormalOffsetAmount > .8)
            globalNormalOffsetAmount += .15;
        else
            globalNormalOffsetAmount += .05;
        if(globalNormalOffsetAmount>5)globalNormalOffsetAmount=5;
        
        $("#normal-offset-amount").val(globalNormalOffsetAmount/.025)
        handleMouseInteraction(globalNormalOffsetAmount);
        // if(!mouse.down)
        //     handleUiUpdating(globalNormalOffsetAmount);
    }

    if(e.keyCode==186){
        if(globalNormalOffsetAmount<-2.)
            globalNormalOffsetAmount -= .25;
        else if(globalNormalOffsetAmount < -.8)
            globalNormalOffsetAmount -= .15;
        else
            globalNormalOffsetAmount -= .05;
        if(globalNormalOffsetAmount<-5)globalNormalOffsetAmount=-5;
        
        $("#normal-offset-amount").val(globalNormalOffsetAmount/.025)
        handleMouseInteraction(globalNormalOffsetAmount);
        // if(!mouse.down)
        //     handleUiUpdating(globalNormalOffsetAmount);

    }

    if(e.keyCode==76){
        globalNormalOffsetAmount = 0;
        $("#normal-offset-amount").val(globalNormalOffsetAmount/.025)
        handleMouseInteraction(globalNormalOffsetAmount);
        // if(!mouse.down)
        //     handleUiUpdating(globalNormalOffsetAmount);
    } 

    if(!mouseOverTools){
        if(e.keyCode==49){//1
            //console.log($("#title-simple-shapes").top);
            const top = $("#title-Simple-Shapes").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==50){//2
            const top = $("#title-Animals").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==51){//3
            const top = $("#title-Consumables").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==52){//4
            const top = $("#title-Furnishings").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==53){//5
            const top = $("#title-Microscopic").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==54){//6
            const top = $("#title-Plants").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==55){//7
            const top = $("#title-Underwater").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==56){//8
            const top = $("#title-Trees").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==57){//9
            const top = $("#title-Rocks").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==48){//0
            const top = $("#title-Human").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        
        if(e.keyCode==85){//u
            const top = $("#title-Vehicles").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        //if(e.keyCode==87){//y
        if(e.keyCode==73){//i
            const top = $("#title-Buildings").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        //if(e.keyCode==69){//u
        if(e.keyCode==79){//o
            const top = $("#title-Zeometry").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
        if(e.keyCode==80){//p
            const top = $("#title-Space").position().top;
            $("#select").animate({ scrollTop: top }, 700);
        }
    }

    if(e.keyCode==67){
        resetCam();
    }
    if(e.keyCode==66){
        toggleDrawObject();
    }
    if(e.keyCode == 86){//v
        updateDrawState();
    }
    
    /*

    function updateScaleOffset(){
    const s = $("#stroke-scale-offset").val()*.01;
   
    if(currentSelectedStrokeIndex != -1){
        actionHelper.updateScaleOffset(currentSelectedStrokeIndex, s)
    }
}


    */

    if(e.keyCode == 187){//+    
        if(!strokeSelect){
            if(meshScale>2.)
                meshScale += .25;
            else if(meshScale>1.)
                meshScale += .15;
            else
                meshScale += .05;
            if(meshScale<0)meshScale=0;
            if(meshScale>14)meshScale=14;
            $("#size-slider").val(meshScale/.08)
        }else{
            if(currentSelectedStrokeIndex != -1){
                const s  = actionHelper.offsetScaleKeyPress(currentSelectedStrokeIndex, .1);
                $("#stroke-scale-offset").val(s/.01);
            }
        }
    }
    
    
    if(e.keyCode == 189){//-
        if(!strokeSelect){
            if(meshScale>2.)
                meshScale -= .25;
            else if(meshScale>1.)
                meshScale -= .15;
            else
                meshScale -= .05;

            if(meshScale<0)meshScale=0;
            if(meshScale>14)meshScale=14;
            $("#size-slider").val(meshScale/.08)
        }else{
            if(currentSelectedStrokeIndex != -1){
                const s = actionHelper.offsetScaleKeyPress(currentSelectedStrokeIndex, -.1);
                $("#stroke-scale-offset").val(s/.01);
            }
        }
    }

    if(e.keyCode == 219){//+    
        $("#view-draw-distance").val((bgMesh.position.z-.1)*-1);
        updateDrawViewDistance(bgMesh.position.z - .1);
    }
    if(e.keyCode == 221){//+   
        $("#view-draw-distance").val((bgMesh.position.z+.1)*-1);
        updateDrawViewDistance(bgMesh.position.z + .1);
     }

    if(e.keyCode == 70){//f
       toggleFullscreen();
    }
    if(e.keyCode == 18){//alt
        if(controls){
            controls.enableRotate = true;
        }
    }
    if(e.keyCode == 17){//ctrl
        if(controls){
            controls.enablePan = true;
        }
    }
    if(e.keyCode==16){//shift
        if(canTogglStrokeSelect){
            toggleStrokeSelect();
            canTogglStrokeSelect = false;
        }
    }

    
    if(e.keyCode == 90){//undo
        if(controls.enablePan){
            e.preventDefault();
            undoClick();
        }
    }
    if(e.keyCode==89){//redo
        if(controls.enablePan){
            e.preventDefault();
            redoClick();
        }
    }

    if(strokeSelect && currentSelectedStrokeIndex != -1){
        switch(e.keyCode){
            case 87: // W
                transformControls.setMode( 'translate' );
                break;
            case 69: // E
                transformControls.setMode( 'rotate' );
                break;
            case 82: // R
                transformControls.setMode( 'scale' );
                break;
        }
    }
}


function onKeyUp(e) {
    
    e.preventDefault();

    if(e.keyCode ==83){
        scatterSelectPressed = false;   
    }

    if(e.keyCode==90){
        scatterPressed = false;
        canTogglStrokeSelect = true;
    }

    if(e.keyCode==16){//shift
     
        canTogglStrokeSelect = true;
       
    }

    if(e.keyCode == 18){
        if(controls){
            controls.enableRotate = false;
        }
    } 
    if(e.keyCode == 17){
        if(controls){
            controls.enablePan = false;
        }
    }
    if(e.keyCode==32){
        e.preventDefault();
        if(mouseOverSelect){
            toggleFullScreenThumbs();
        }else{
            toggleUI();
        }
        

    }
}

function toggleFullScreenThumbs(){
    btns.fullThumbs = !btns.fullThumbs;
    //$("#select").css( "width", btns.fullThumbs ? "100%" :"22vw" );
   
    //$("#select").css( "background-color", btns.fullThumbs ? "rgba(0,0,0,1)" :"rgba(0,0,0,.3)" );
    if(btns.fullThumbs){
        $('#select').addClass('select-black-bg');
    }else{
        $('#select').removeClass('select-black-bg');
    }
}

function toggleUI(){
    btns.space = !btns.space;
    $(".holders").css( "display", btns.space ? "block" :"none" );
    if(mirrorX){
        mirrorMeshX.visible = btns.space; 
    }
    if(mirrorY){
        mirrorMeshY.visible = btns.space; 
    }
    if(mirrorZ){
        mirrorMeshZ.visible = btns.space; z
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    //composer.setSize( window.innerWidth, window.innerHeight );

}


function onMouseUp(e){
	
    if(e.button==0){
        
        mouse.down = false;
    	holding = false;
    	
        mouseConstraint = null;
        mouse.previous = new THREE.Vector2();
        ot = false;
        
        if(!movingCamera){
            
            buildGeo();
            helper.copyMaterial({  param:getMatParam(), matHandler:matHandler });
            
        }
        
        //scatterMode = false;
        movingCamera = false;
        
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        mouse.rots = [];
        mouse.scales = [];
        mouse.scatterInfo = [];
        mouse.smoothAvgs = [];
        currentDrawHitPoint = null;
        mouse.smoothInc = 0;
        geoArr = [];

        //if(controls)
            //controls.enabled = true;
        
       // yInc+=yOff;
       // bgMesh.position.z = yInc;
    }

}



function strokeSelectHelper(down){

    raycaster.setFromCamera( mouse.normal, camera );
    
    const intersects = raycaster.intersectObjects( strokeHolder.children );
    // Toggle rotation bool for meshes that we clicked
    if ( intersects.length > 0 ) {
        
        let ind = intersects[ 0 ].object.paintIndex;
        
        const canHover = (!movingTransformControls && ind != currentSelectedStrokeIndex && !controls.enableRotate && !controls.enablePan);
        if(canHover)document.body.style.cursor = "pointer";
        
        // if(ind==null)
        //     ind = getFirstObjectWithPaintIndex(intersects[ 0 ]);
        
        if(down && canHover){
            
            if(ind != currentSelectedStrokeIndex){

                //strokeSelectStrokes = [];
                currentSelectedStrokeIndex = ind;
                
                $("#stroke-index-input").val(currentSelectedStrokeIndex)
                actionHelper.select(currentSelectedStrokeIndex, transformControls);
                updateStrokeSelectSlidersFromObject(actionHelper.actionsArr[currentSelectedStrokeIndex][0].stroke);

            }

        }
       
        actionHelper.unHover();

      
        if(canHover)
            actionHelper.hover(ind)
        
    }else{
      
        actionHelper.unHover();
        document.body.style.cursor = "auto";

    }
}

function updateStrokeSelectSlidersFromObject(obj){
    /*
    this.sclMult = OBJ.all.sclMult;
    this.rotOffsetX = OBJ.all.rotOffsetX;
    this.rotOffsetY = OBJ.all.rotOffsetY;
    this.rotOffsetZ = OBJ.all.rotOffsetZ;
    this.param
    */
    //console.log(obj);
    $("#stroke-scale-offset").val(obj.sclMult/.01);
    
    $("#stroke-rot-offset-x").val(obj.rotOffsetX*(57.296*.5));
    $("#stroke-rot-offset-y").val(obj.rotOffsetY*(57.296*.5));
    $("#stroke-rot-offset-z").val(obj.rotOffsetZ*(57.296*.5));
    
    const loop = obj.param.shouldLoopGradient == 1 ? true : false;
    
    $("#twist-deform").val(obj.param.twistAmt/.03);
    $("#noise-size").val(obj.param.noiseSize/.04); 
    $("#twist-size").val(obj.param.twistSize/.04);
    $("#noise-deform").val(obj.param.noiseAmt/.01);
    $("#rainbow-tint-amount").val(obj.param.rainbowAmt/.01);
    $("#model-gradient-size").val( (obj.param.gradientSize) / .01);
    $("#model-gradient-angle").val( (obj.param.gradientAngle) / .01);
    $("#model-gradient-add").val( (obj.param.gradientAdd) / .01);
    $("#rainbow-size").val(obj.param.rainbowGradientSize /.08);
    $("#model-gradient-offset").val(obj.param.gradientOffset/.3);
    $("#model-color-top").val("#"+obj.param.topColor.getHexString());
    $("#model-color-bottom").val("#"+obj.param.bottomColor.getHexString())
    $("#deform-speed").val(obj.param.deformSpeed/.03);
    $("#color-speed").val(obj.param.colorSpeed/.03);
    $("#loop-gradient").prop( "checked", loop );

}

function getFirstObjectWithPaintIndex(arr){
    for(let i = 0;i <arr.length; i++){
        if(arr[i].object.paintIndex!=null){
            return arr[i];
        }
    }
}

//function getMeshesFrom



function onMouseDown(e){
    //console.log("paint meshes length = "+paintMeshes.length);
    if(showingContext){
        killContext();
        return;
    }
    if(e.touches != null){//if not mobile just set mouse.nomral in mouse move event  
        var touch = e.touches[0];
        const x = touch.pageX;
        const y = touch.pageY;
        mouse.normal.x =    ( x / window.innerWidth ) * 2 - 1;
        mouse.normal.y =  - ( y / window.innerHeight ) * 2 + 1;
        mouse.previous.x = x;
        mouse.previous.y = y;
        mouse.position.x = x;
        mouse.position.y = y;
        
    }

    if(strokeSelect){
        strokeSelectHelper(true);
        return;
    }

    //strokeSelectStrokes = [];
    currentSelectedStrokeIndex = -1;
    transformControls.detach();

    if(controls){

        let mobileTwoFingerCheck = false;
        
        if ( e.touches!=null ) {
            if(e.touches.length > 1)
                mobileTwoFingerCheck = true;
        }
        
        if(controls.enableRotate || controls.enablePan || mobileTwoFingerCheck){
            movingCamera = true;
            return;
        }
    }

    let canDraw = false;
    if(e.button!=null){
        if(e.button==0)
            canDraw = true;
    }

    if(e.touches != null){
        if(e.touches.length == 1){
            canDraw = true;
        }
            
    }


    if(canDraw ){
        
        mouse.down = true;

        if(e.pointerType == "pen" && shouldDoPenPressure){
            penSense = e.pressure;
        }else{
            penSense = 1;
        } 

        handleDrawGeo();

    }
    
}


function onMouseMove(e){

    //window.focus();
    //console.log()
    if(e.touches==null){
        if(strokeSelect){
            strokeSelectHelper(false);
            //return;
        }
    }
    
    if(e.target.id == "draw-canvas"){
        mouseOverSelect = false;
        mouseOverTools = false;
        killContext();
    }
    
    

    let x = 0;
    let y = 0;

    if(e.touches!=null){
        var touch = e.touches[0];
        x = touch.pageX;
        y = touch.pageY;
    }else{
        x = e.clientX;
        y = e.clientY;
    }
    
    mouse.position.x =  x;
	mouse.position.y =  y;

	mouse.normal.x =    ( x / window.innerWidth ) * 2 - 1;
	mouse.normal.y =  - ( y / window.innerHeight ) * 2 + 1;
    
    // See if the ray from the camera into the world hits one of our meshes
    if(drawObject && helper && e.target.className=="customCanvas"){
        //if(helper && ){
            helper.doMouseInteraction({
                mouse:mouse, 
                camera:camera, 
                bgMesh:bgMesh, 
                drawObject:drawObject,
                drawState:drawState,
                globalNormalOffsetAmount:globalNormalOffsetAmount
            });
        //}
    }
    
  
    ///console.log(movingTransformControls)
    //if(strokeSelect && movingTransformControls){//update mirrored local transform when moving control
    if(movingTransformControls && currentSelectedStrokeIndex != -1){
        actionHelper.updateTransform(currentSelectedStrokeIndex);//, {pos:t.sub, rot:t.rot, scl:t.scl});
    }
    
    if ( e.touches != null ) {
        if(e.touches.length > 1)
            return;
    }

    if(mouse.down){
        
        if(mouse.previous.x != 0 || mouse.previous.y != 0){
            if(e.pointerType  == "pen" && shouldDoPenPressure){
                penSense = e.pressure;
            }else{
                penSense = 1;
            }

            handleDrawGeo(false);

        }
        
    }
    
    mouse.previous = x;
    mouse.previous = y;
   
    mouse.previousNormal.x =    ( mouse.position.x / window.innerWidth ) * 2 - 1;
    mouse.previousNormal.y =  - ( mouse.position.y / window.innerHeight ) * 2 + 1;

}



function toggleInstructions(){
  
    if ( $( "#instructions-overlay" ).is( ":hidden" ) ) {
        $( "#instructions-overlay" ).fadeIn( );
        if(!isMobile){
            $( "#instructions-holder" ).fadeIn( );
        }else{
            $( "#instructions-holder-mobile" ).fadeIn( );
        }
    } else {
        $( "#instructions-overlay" ).fadeOut();
    }
}

function handleDrawGeo(){
    
    if(!ot){
        ctx.beginPath();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ot = true;        
    }
    
    ctx.moveTo(mouse.previous.x, mouse.previous.y);
    ctx.lineTo(mouse.position.x, mouse.position.y);
    ctx.stroke();
    let arr = [bgMesh];
    if(drawState == "object"){
        arr = [drawObject];
    }else if(drawState=="both"){
        arr = [drawObject, bgMesh];
    }
    const obj = getHitPointFromMesh(arr, mouse.normal);
    const point = obj.point;
    const normal = obj.normal;
    if(point){
        currentDrawHitPoint = obj.point.add(normal.multiplyScalar(globalNormalOffsetAmount));
    }

   

}


function buildGeo(){
    
    const strokeFinal = [];
    const total = Math.ceil( mouse.smoothAvgs.length * globalDensityAmount);

    if(total>0){
        actionHelper.startNewPath();//if you undo remove items in the undo array after the currStrokeIndex
        
        //const meshClone = helper.holder.clone();
        const meshClone = helper.holder;//.clone();

        const all = {
            loadObj:loadobjs, //non dinamic
            matHandler:matHandler, // non dinamic
            paintMeshes:paintMeshes, //non dinamic
            version:appVer,//
            modelInfo:{modelIndex:modelIndex,urlIndex:urlIndex}, 
            meshClone:meshClone, 
            index:actionHelper.currStrokeIndex, 
            scene:strokeHolder, 
            globalDensityAmount:globalDensityAmount, 
            meshScale:meshScale,
            globalShouldAnimateSize:(scatterMode==true) ? false:globalShouldAnimateSize,
            param:getMatParam(),
            sclMult:1,
            rotOffsetX:globalOffsetRotation.x,
            rotOffsetY:globalOffsetRotation.y,
            rotOffsetZ:globalOffsetRotation.z,
            scatter:scatterMode,
            scatterInfo:mouse.scatterInfo,
            transformOffset:{pos:new THREE.Vector3(), rot:new THREE.Euler(), scl:new THREE.Vector3(1,1,1)}
        }
        
        let stroke = new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} );
        strokeFinal.push({stroke:stroke, index:actionHelper.currStrokeIndex, scene:all.scene});
        
        if(mirrorX){
            all.scene = reflectObjectX;
            stroke = new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} );
            strokeFinal.push({stroke:stroke,  index:actionHelper.currStrokeIndex, scene:all.scene});
        }

        if(mirrorY){
            all.scene = reflectObjectY;  
            stroke = new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} );
            strokeFinal.push({stroke:stroke, index:actionHelper.currStrokeIndex, scene:all.scene});
            if(mirrorX){
                all.scene = reflectObjectXY;
                stroke = new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} );
                strokeFinal.push({stroke:stroke, index:actionHelper.currStrokeIndex, scene:all.scene});
            }
            
        }

        if(mirrorZ){
            all.scene = reflectObjectZ;
            stroke = new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} );  
            strokeFinal.push({stroke:stroke, index:actionHelper.currStrokeIndex, scene:all.scene});
            if(mirrorX){
                all.scene = reflectObjectXZ;
                stroke = new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} );
                strokeFinal.push({stroke:stroke, index:actionHelper.currStrokeIndex, scene:all.scene});
            }
            if(mirrorY){
                all.scene = reflectObjectYZ;
                stroke = new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} );
                strokeFinal.push({stroke:stroke, index:actionHelper.currStrokeIndex, scene:all.scene});
            }
        }

        if(mirrorX && mirrorY && mirrorZ){
            all.scene = reflectObjectXYZ;
            stroke = new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} );
            strokeFinal.push({stroke:stroke, index:actionHelper.currStrokeIndex, scene:all.scene});
        
        }
        actionHelper.addStrokesArray({array:strokeFinal});

    }

}


function onFocus(){
     if(controls){
        controls.enableRotate=false;
        controls.enablePan = false;
    }
}
function onBlur(){
    if(controls){
        controls.enableRotate=false;
        controls.enablePan = false;
    }
}

function saveGeoInkFile(){
    const arr = actionHelper.getExportData();
   
    let drawObj = 0;
    if(!usingCustomDrawObject){
        drawObj = currentDrawObjectIndex;
    }
    //console.log(drawObj)
    download( {strokes:arr, background: background.getExportData(), drawObj:drawObj});
}


function download (geoink){
  const hash = "everything-canvas";
  const blob = createBlobFromData({
    geoink,
  });
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${hash}`;
  link.href = fileUrl;
  link.click();
};

function createBlobFromData (data) {
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'text/plain' });
  return blob;
};


function undoClick(){
    if(actionHelper.currStrokeIndex > 0){
        
        currentSelectedStrokeIndex = -1;
        transformControls.detach();

        actionHelper.undo();
    }
}

function redoClick(){
    
    if(actionHelper.currStrokeIndex < actionHelper.actionsArr.length){
    
        actionHelper.redo();

    }
    
}

function updateDrawState(){
   
    switch(drawState){
        case "object"://switch to both
            bgMesh.visible = true;
            drawState = "both";
            document.getElementById("toggle-draw-on-view").innerHTML = "view & object";
        break;
        case "both"://siwtch to view
            bgMesh.visible = true;
            drawState = "view";
            document.getElementById("toggle-draw-on-view").innerHTML = "view";
        break;
        case "view": //switch to object
            drawState = "object";
            bgMesh.visible = false;
            document.getElementById("toggle-draw-on-view").innerHTML = "object";
    }
    
}


function updateRotOffsetX(){
    const rx = $("#stroke-rot-offset-x").val() * Math.PI/(180/2);
   
    if(currentSelectedStrokeIndex != -1){
        actionHelper.updateRotOffsetX(currentSelectedStrokeIndex, rx)
    }
}
function updateRotOffsetY(){
    const ry = $("#stroke-rot-offset-y").val() * Math.PI/(180/2);
    
    if(currentSelectedStrokeIndex != -1){
        actionHelper.updateRotOffsetY(currentSelectedStrokeIndex, ry)
    }
}
function updateRotOffsetZ(){
    const rz = $("#stroke-rot-offset-z").val() * Math.PI/(180/2);
    
    if(currentSelectedStrokeIndex != -1){
        actionHelper.updateRotOffsetZ(currentSelectedStrokeIndex, rz)
    }
}

function updateScaleOffset(){
    const s = $("#stroke-scale-offset").val()*.01;
   
    if(currentSelectedStrokeIndex != -1){
        actionHelper.updateScaleOffset(currentSelectedStrokeIndex, s)
    }
}

function updateMeshSize(){
    const s = $("#size-slider").val()*.08;
    meshScale = s;
}

function rotateBrushX(){
    globalOffsetRotation.x = $("#rotate-slider-x").val()*0.01745329251;
    helper.resetAdditiveRot(); 
    //helper.holder.rotation.set(globalOffsetRotation.x,globalOffsetRotation.y,globalOffsetRotation.z);
}
function rotateBrushY(){
    globalOffsetRotation.y = $("#rotate-slider-y").val()*0.01745329251;
    helper.resetAdditiveRot();
    //helper.holder.rotation.set(globalOffsetRotation.x,globalOffsetRotation.y,globalOffsetRotation.z);
}
function rotateBrushZ(){
    globalOffsetRotation.z = $("#rotate-slider-z").val()*0.01745329251;
    helper.resetAdditiveRot();
    //helper.holder.rotation.set(globalOffsetRotation.x,globalOffsetRotation.y,globalOffsetRotation.z);
}
function updateSmoothAmount(){
    globalSmoothAmount = 1-($("#smooth-amount").val()*.01);
}
function updateNormalOffsetAmount(){
   
    globalNormalOffsetAmount = $("#normal-offset-amount").val()*.025;
    //console.log(globalNormalOffsetAmount)
    handleUiUpdating(globalNormalOffsetAmount);

}

function UpdateDrawObjectOpacity(o){
    if(drawObject.isMesh){
        drawObject.material.transparent = o >= .59 ? false : true;
        drawObject.material.opacity = o >= .59 ? 1.0 : o;
        drawObject.material.blending = o >= .59 ? THREE.NormalBlending : THREE.AdditiveBlending;
        drawObject.material.depthWrite = o >= .59 ? true : false;
        drawObject.material.needsUpdate = true;
    }else{
        drawObject.traverse(function(obj){
            if(obj.isMesh){
                obj.material.transparent = o >= .59 ? false : true;
                obj.material.opacity = o >= .59 ? 1.0 : o;
                obj.material.blending = o >= .59 ? THREE.NormalBlending : THREE.AdditiveBlending;
                //obj.material.blending = THREE.NormalBlending;
                obj.material.depthWrite = o >= .59 ? true : false;
                obj.material.needsUpdate = true;
            }
        })
    }
}

function toggleScatter(){
    scatterChecked = !scatterChecked;
}
function toggleScatterSelect(){
    scatterSelectActive = !scatterSelectActive;
    if(!scatterSelectActive){
        scatterArray = [];
        updateScatterDom();
        scatterArray.push({modelIndex:modelIndex, urlIndex:urlIndex});
    }
}

function toggleSizeEasing(){
    globalShouldAnimateSize = !globalShouldAnimateSize;
}

function handleUiUpdating(nrml){
    
    mouse.normal.x = 0;
    mouse.normal.y = 0;
    handleMouseInteraction(nrml);
    // helper.doMouseInteraction({
    //     mouse:mouse, 
    //     camera:camera, 
    //     bgMesh:bgMesh, 
    //     drawObject:drawObject,
    //     drawState:drawState,
    //     globalNormalOffsetAmount: nrml==null ? 0 : nrml
    // });
}

function handleMouseInteraction(nrml){
    helper.doMouseInteraction({
        mouse:mouse, 
        camera:camera, 
        bgMesh:bgMesh, 
        drawObject:drawObject,
        drawState:drawState,
        globalNormalOffsetAmount: nrml==null ? 0 : nrml
    });
}

function updateDensity(){
    globalDensityAmount = $("#density-amount").val()*.0031;
    //console.log(globalDensityAmount)
    
}

function toggleRotationFollowingNormal(){
    rotationFollowsNormal = !rotationFollowsNormal;
}

function updateRotationSpeed(){
    globalAdditiveRotationSpeed = $("#additive-rotation-slider").val()*.001;
}
function toggleAdditiveRotationX(){
    shouldRotateAdditiveX = !shouldRotateAdditiveX;
}
function toggleAdditiveRotationY(){
    shouldRotateAdditiveY = !shouldRotateAdditiveY;
}
function toggleAdditiveRotationZ(){
    shouldRotateAdditiveZ = !shouldRotateAdditiveZ;
}

function updateAniSpeed(){
    globalAnimationSpeed = $("#animation-speed-slider").val()*.1;
}

function toggleDrawObject(){
    drawObject.visible = !drawObject.visible;
    if(drawObject.visible){
        document.getElementById("toggle-draw-object").innerHTML="hide draw object";
    }else{
        document.getElementById("toggle-draw-object").innerHTML="show draw object";
    }
}

function toggleMirrorX(){
    mirrorX = !mirrorX;
    mirrorMeshX.visible = mirrorX;
}
function toggleMirrorY(){
    mirrorY = !mirrorY;
    mirrorMeshY.visible = mirrorY;
}
function toggleMirrorZ(){
    mirrorZ = !mirrorZ;
    mirrorMeshZ.visible = mirrorZ;
}


function exportGLTF(  ) {
    
    const anis = actionHelper.getAnis();

    const meshes = [];
    
    const gltfExporter = new GLTFExporter();

    const options = {
        trs: true,
        onlyVisible: true,
        binary: true,
        maxTextureSize: 2048,
        animations:anis
    };

    gltfExporter.parse(
        strokeHolder,
        function ( result ) {

            if ( result instanceof ArrayBuffer ) {

                saveArrayBuffer( result, 'scene.glb' );

            } else {

                const output = JSON.stringify( result, null, 2 );
                saveString( output, 'scene.gltf' );

            }

        },
        function ( error ) {

            //console.log( 'An error happened during parsing', error );
            alert("shoot, there was an error exporter :/")

        },
        options
    );

}

function save( blob, filename ) {
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}


function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}
function saveString( text, filename ) {
    save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}

function onDocumentDragOver( event ) {
    event.preventDefault();
    $("#drag-drop").fadeIn();    
}

function onInstructionsDragOver(event){
    event.preventDefault();
    if ( !$( "#instructions-overlay" ).is( ":hidden" ) ) {
        $( "#instructions-overlay" ).hide();
    } 
}

function onDocumentLeave( event ) {
    event.preventDefault();
    $("#drag-drop").fadeOut();
}


function replaceDrawObject(src,scl){
    const vis = drawObject == null ? true : drawObject.visible;//if draw object is null, vis = true, if not null set to current visibility 
    let s = scl!=null ? scl : 1;
    
    const loader = new GLTFLoader();
    loader.load( src, function ( gltf ) {
        killObject(drawObject);
        
        //currentDrawObjectIndex = 100000;
        
        gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material.vertexColors = false;
               // drawObject = child;
               // scene.add(drawObject);
            }
        });
        gltf.scene.scale.set(s,s,s);
        scene.add(gltf.scene)

        drawObject = gltf.scene;
        drawObject.visible = vis;
    });
}

function imgPlaneDrawObject(src){
    killObject(drawObject);
    //const tex = new THREE.Texture()
    const tex = new THREE.TextureLoader().load( src, function(){
        
        //currentDrawObjectIndex = 100000;
        const w = tex.image.width;
        const h = tex.image.height;
        
        let aspect = (h > w) ? w / h : h / w;  
        let wF = (h > w) ?  1 * aspect : 1;  
        let hF = (w > h) ?  1 * aspect : 1;

        const mat = new THREE.MeshBasicMaterial({map:tex})
        const geo = new THREE.PlaneGeometry(wF*20,hF*20,1,1);
        const plane = new THREE.Mesh(geo,mat);
        const obj = new THREE.Object3D();
        obj.add(plane);
        scene.add(obj);
        drawObject = obj;
        
    } );
    
}


function onDocumentDrop( event ) {

    event.preventDefault();
    $("#drag-drop").fadeOut();
    //console.log(event.dataTransfer)
    const file = event.dataTransfer.files[ 0 ];
    //event.origin
    if(file != null){
        const ext = file.name.substr(file.name.length - 3).toLowerCase();
        //console.log(file.name);
        if( ext == "glb" || ext == "ltf" ){
            const reader = new FileReader();
            reader.onload = function ( event ) {
                replaceDrawObject(event.target.result);
            };
            reader.readAsDataURL( file );
        }else if(ext=="peg" || ext=="jpg" || ext=="png" ){
            
            var imageUrl = event.dataTransfer.getData('text/html');
            if(imageUrl!=null && imageUrl!=""){
                const url = $(imageUrl).attr("src");
                if(url!=null){
                    
                    const split = url.split("/");
                    const fileName = split[split.length-1].substr(0,split[split.length-1].length-3)+"glb";
                    const modelUrl = "./extras/models/"+split[split.length-2]+"/"+fileName;
                    usingCustomDrawObject = true;
                    replaceDrawObject(modelUrl, 30);
                    
                    currDragImgSrc = null;
                }
                
            }else{
                
                const reader = new FileReader();
                reader.onload = function ( event ) {
                    usingCustomDrawObject = true;
                    imgPlaneDrawObject(event.target.result);
                };
                reader.readAsDataURL( file );

            }
        
        }else if(ext == "txt"){
            
            if(strokeSelect){
                toggleStrokeSelect();
            }

            const reader = new FileReader();
            reader.onload = function ( event ) {

                readTextFile( event.target.result,  function(text){
                    //const urlFinal = "final-json-info.json"
                    //{ obj:JSON.parse(text), hash:hash }
                    loadedObject = JSON.parse(text);
                    strokesLoopHelper = 0;

                    const bg = loadedObject.geoink.background;
                    bg.top = new THREE.Color("#"+bg.top);
                    bg.bottom = new THREE.Color("#"+bg.bottom);
                    background.update(bg);
                    if(loadedObject.geoink.drawObj != currentDrawObjectIndex){
                        replaceDrawObject("./extras/draw/"+loadedObject.geoink.drawObj+".glb");
                    }
                    const arr = [];
                    const strokeAmt = (loadedObject.geoink.strokes[loadedObject.geoink.strokes.length-1].all.index )+ 1;
                    for(let i = 0; i<strokeAmt; i++){
                        const a = getAllMeshObjectsWithSameIndex(i, loadedObject.geoink.strokes);
                        arr.push(a);
                    }
                    loadedObject.geoink.formattedArray = arr; 
                    loadLoop();
                   
                });

            };
            reader.readAsDataURL( file );

        }
    }else{
        if( currDragImgSrc != null ){
            usingCustomDrawObject = true;
            const fnl = currDragImgSrc.substr(0,currDragImgSrc.length - 3)+"glb";
            replaceDrawObject(fnl, 30);
            currDragImgSrc = null;
        }
    }

}

function loadLoop(){

    const i = strokesLoopHelper;

    const arr = loadedObject.geoink.formattedArray;
    if(arr[i].length==0){
        strokesLoopHelper++;
        if(strokesLoopHelper<arr.length)
            loadHelper();
        return;
    }

    const stroke = arr[i][0];
    
    //if(stroke==null)
    const a = stroke.all;
    const mi = a.modelInfo.modelIndex;
    const ui = a.modelInfo.urlIndex;
    
    const p =  a.param;
    const param = {
        twistAmt:p.twistAmt,
        noiseSize:p.noiseSize,
        twistSize:p.twistSize,
        noiseAmt:p.noiseAmt,
        rainbowAmt:p.rainbowAmt,
        gradientSize:p.gradientSize,
        gradientAngle:p.gradientAngle==null?0:p.gradientAngle,
        gradientAdd:p.gradientAdd==null?0:p.gradientAdd,
        rainbowGradientSize:p.rainbowGradientSize,
        gradientOffset:p.gradientOffset,
        topColor:new THREE.Color("#"+p.topColor),
        bottomColor:new THREE.Color("#"+p.bottomColor),
        deformSpeed:p.deformSpeed,
        colorSpeed:p.colorSpeed,
        shouldLoopGradient:p.shouldLoopGradient
    }

    const rots = [];
    const pos = [];
    const scls = [];

    for(let k = 0; k<stroke.rots.length; k++){
        
        const r = stroke.rots[k];
        const p = stroke.pos[k];
        const s = stroke.scales[k];
        
        rots.push(new THREE.Quaternion(r._x, r._y, r._z, r._w))
        pos.push(new THREE.Vector3(p.x, p.y, p.z));
        scls.push(s);

    }

    const sclMult = a.sclMult == null ? 1. : a.sclMult;
    const rotOffsetX = a.rotOffsetX == null ? 0. : a.rotOffsetX;
    const rotOffsetY = a.rotOffsetY == null ? 0. : a.rotOffsetY;
    const rotOffsetZ = a.rotOffsetZ == null ? 0. : a.rotOffsetZ;
    const scatter = a.scatter == null ? false : a.scatter;
    const scatterInfo = a.scatterInfo == null ? [] : a.scatterInfo;
    //console.log(a);
    const version = a.version == null ? 0 : a.version;
    
    console.log("version = "+version);
    //console.log(a.transformOffset)
    const transformOffset = a.transformOffset == null 
    ? {pos:new THREE.Vector3(), rot:new THREE.Euler(), scl:new THREE.Vector3(1,1,1)} 
    : {
        pos:new THREE.Vector3( a.transformOffset.pos.x, a.transformOffset.pos.y, a.transformOffset.pos.z),
        rot:new THREE.Euler( a.transformOffset.rot._x, a.transformOffset.rot._y, a.transformOffset.rot._z),
        scl:new THREE.Vector3( a.transformOffset.scl.x, a.transformOffset.scl.y, a.transformOffset.scl.z)
    };
    
    const all = {
        loadObj:loadobjs, //non dinamic
        matHandler:matHandler, // non dinamic
        paintMeshes:paintMeshes, //non dinamic

        modelInfo:{modelIndex:mi,urlIndex:ui}, 
        meshClone:null, 
        index:actionHelper.currStrokeIndex, 
        scene:strokeHolder, //place holder
        globalDensityAmount:a.globalDensityAmount, 
        meshScale:a.meshScale,
        sclMult:sclMult,
        rotOffsetX:rotOffsetX,
        rotOffsetY:rotOffsetY,
        rotOffsetZ:rotOffsetZ,
        transformOffset:transformOffset,
        scatter:scatter,
        scatterInfo:scatterInfo,
        version:version,
        globalShouldAnimateSize:a.globalShouldAnimateSize,
        param:param
    }
    //console.log(i);
    chooseModel(ui, mi, param, function(sn){
        //const strokes = loadedObject.geoink.strokes;
        all.meshClone = sn.clone();
        all.meshClone.traverse( function ( child ) {
            if ( child.isMesh ) {
                if(child.material!=null){
                    let copy = child.material.clone();
                    copy = matHandler.getCustomMaterial(copy, all.param);
                    child.material = copy;
                }
            }
        });
        const strokeFinal = [];
        for(let i = 0; i<arr[strokesLoopHelper].length; i++){
            const currStroke = arr[strokesLoopHelper][i];
            all.scene = scene.getObjectByName(currStroke.all.scene);
            const strk = new Stroke( {scl:scls, pos:pos, rots:rots, all:all} );
            strokeFinal.push({stroke:strk, index:actionHelper.currStrokeIndex, scene:all.scene});
        }

        actionHelper.addStrokesArray({array:strokeFinal});
        
        strokesLoopHelper++;
        if(strokesLoopHelper<arr.length)
            loadHelper();

    }, version);
}
function loadHelper(){
    loadLoop();
}


function getAllMeshObjectsWithSameIndex(index, fullArray){
    const arr = [];
    for(let i = 0; i<fullArray.length; i++){
        if(fullArray[i].all.index==index){
            arr.push(fullArray[i]);
        }
    }
    return arr;
}


function readTextFile(file, callback) {
    const rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}
  

function killObject(obj){
    
    obj.traverse( function ( obj ) {
        handleKill(obj);
    });
    handleKill(obj);
    //scene.remove(obj); 
}

function handleKill(obj){
    if(obj.isMesh || obj.isSkinnedMesh){
           
        if(obj.material !=null ){
            
            for (const [key, value] of Object.entries(obj.material)) {
                if( key.includes("Map") || key.includes("map") ){
                    if(value != null && value.isTexture){
                        value.dispose();
                    }
                }
            }
            obj.material.dispose();
        }
        obj.geometry.dispose();
        //obj.dispose();
    }
    scene.remove(obj);
}

