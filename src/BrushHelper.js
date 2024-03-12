import {
    ConeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Euler,
    Mesh,
    MeshPhysicalMaterial
} from './build/three.module.js';

class BrushHelper {
    
    constructor(OBJ){
        this.raycaster = OBJ.raycaster;
        const geometryHelper = new ConeGeometry( .1, .2, 5 );
        geometryHelper.translate( 0, -.1, 0 );
        geometryHelper.rotateX( Math.PI / 2 );
        this.mesh = new Mesh( geometryHelper, new MeshBasicMaterial({visible:false}) );
        this.visual = new Mesh(geometryHelper, new MeshStandardMaterial());
        this.holder;
        this.rotAdditive = new Euler();
        this.scene = OBJ.scene;
        this.scene.add( this.mesh, this.visual );
        
    }

    update(OBJ){
       
        this.visual.position.lerp(this.mesh.position, OBJ.globalSmoothAmount);// , globalSmoothAmount);
        //this.visual.rotation.copy(this.mesh.rotation);
        //this.visual.quaternion.copy(this.mesh.rotation);
        this.visual.quaternion.slerp( this.mesh.quaternion, 0.1 );

        if(this.holder){
            
            this.holder.traverse(function(child){
                if(child.isMesh){
                    child.rotation.set(OBJ.globalOffsetRotation.x, OBJ.globalOffsetRotation.y, OBJ.globalOffsetRotation.z);
                }
            })
            this.visual.visible = false;
            if(OBJ.drawing){
                this.holder.scale.set(OBJ.meshScale*OBJ.penSense, OBJ.meshScale*OBJ.penSense, OBJ.meshScale*OBJ.penSense);
            }else{
                this.holder.scale.set(OBJ.meshScale, OBJ.meshScale, OBJ.meshScale);  
            }
            //this.holder.scale.set(OBJ.meshScale, OBJ.meshScale, OBJ.meshScale);
            
            this.holder.position.lerp(this.mesh.position, OBJ.globalSmoothAmount);// , globalSmoothAmount);
            this.rotAdditive.x += OBJ.shouldRotateAdditiveX ? OBJ.globalAdditiveRotationSpeed : 0;
            this.rotAdditive.y += OBJ.shouldRotateAdditiveY ? OBJ.globalAdditiveRotationSpeed : 0;
            this.rotAdditive.z += OBJ.shouldRotateAdditiveZ ? OBJ.globalAdditiveRotationSpeed : 0;
            
            if(OBJ.rotationFollowsNormal){
                
                const x = this.visual.rotation.x  + this.rotAdditive.x;
                const y = this.visual.rotation.y  + this.rotAdditive.y;
                const z = this.visual.rotation.z  + this.rotAdditive.z;
                this.holder.rotation.set(x, y, z);
                
            }else{
                this.holder.rotation.set( OBJ.globalOffsetRotation.x + this.rotAdditive.x, OBJ.globalOffsetRotation.y + this.rotAdditive.y, OBJ.globalOffsetRotation.z + this.rotAdditive.z)
            }
        }
    }

    resetAdditiveRot(){
        this.rotAdditive.set(0,0,0)
    }

    doMouseInteraction (OBJ) {
        //console.log(OBJ.mouse.normal)
        this.raycaster.setFromCamera( OBJ.mouse.normal, OBJ.camera );
        let arr = [OBJ.bgMesh];
        if(OBJ.drawState=="object"){
            arr = [OBJ.drawObject];
        }else if(OBJ.drawState=="both"){
            arr=[OBJ.bgMesh, OBJ.drawObject]
        }
        const intersects = this.raycaster.intersectObjects( arr );
        // Toggle rotation bool for meshes that we clicked
        if ( intersects.length > 0 ) {
            
            var n = intersects[ 0 ].face.normal.clone();
            n.transformDirection( intersects[ 0 ].object.matrixWorld );
            n.multiplyScalar( 10 );
            n.add( intersects[ 0 ].point );

            //intersection.normal.copy( intersects[ 0 ].face.normal );
            this.mesh.lookAt( n );

            this.mesh.position.copy( intersects[ 0 ].point.add(intersects[ 0 ].face.normal.multiplyScalar(OBJ.globalNormalOffsetAmount) ) );
        }
    }

    

    updateVisual(OBJ){
        if(this.holder){
            this.killObject(this.holder);
        }
        this.holder = OBJ.mesh.clone();
        this.scene.add(this.holder);
    }
    
    copyMaterial(OBJ){
        const self = this;
        this.holder.traverse( function ( child ) {
            if ( child.isMesh ) {
                if(child.material!=null){
                    
                    let copy = child.material.clone();
                    
                    copy = OBJ.matHandler.getCustomMaterial(copy, OBJ.param);
                    child.material = copy;
                    
                }
            }
        });
    }
    
    killObject(obj){
        const self = this;
        obj.traverse( function ( obj ) {
            self.handleKill(obj);
        });
        self.handleKill(obj);
    }

    handleKill(obj){
        // if(obj.isMesh || obj.isSkinnedMesh){
               
        //     if(obj.material !=null ){
        //         for (const [key, value] of Object.entries(obj.material)) {
        //             if( key.includes("Map") || key.includes("map") ){
        //                 if(value != null && value.isTexture){
        //                     value.dispose();
        //                 }
        //             }
        //         }
        //         obj.material.dispose();
        //     }
        //     obj.geometry.dispose();
        // }
        this.scene.remove(obj);
    }
}

export { BrushHelper };