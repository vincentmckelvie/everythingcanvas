import {
    ConeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Euler,
    Mesh,
    Vector3
} from './build/three.module.js';

class ActionHelper {
    
    constructor(OBJ){
        this.attachScene;
        this.currStrokeIndex = 0;
        this.actionsArr = []; 
    }

    select(index, tc){

        for(let i = 0; i<this.actionsArr[index].length; i++){
            if(this.actionsArr[index][i].stroke.scene.name == "strokeHolder"){//if it's not the mirrored stroke
                tc.detach();
                this.attachScene = this.actionsArr[index][i].stroke.scn;
                tc.attach( this.actionsArr[index][i].stroke.scn );
            }
        }

    }

    unHover(){
        for(let i = 0; i < this.actionsArr.length; i++){
            for(let k = 0; k < this.actionsArr[i].length; k++){
                this.actionsArr[i][k].stroke.unHover();
            }
        }
    }

    hover(index){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].stroke.hover();
        }
    }

    deleteStrokeHelper(index){
     
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].stroke.killStroke();
        }
        
        this.actionsArr.splice(index,1);
        
        for(let t = 0; t<this.actionsArr.length; t++){
            for(let l = 0; l < this.actionsArr[t].length; l++){
                if(this.actionsArr[t][l].index > index){
                    this.actionsArr[t][l].index--;
                    this.actionsArr[t][l].stroke.updatePaintIndex();
                }
            }
        }
        
        this.currStrokeIndex --;
    }
    
    addStrokesArray(OBJ){
        this.actionsArr.push(OBJ.array);
        this.currStrokeIndex ++;
    }
    
    undo(){
        for(let i = 0; i < this.actionsArr[this.currStrokeIndex-1].length; i++){
            this.actionsArr[this.currStrokeIndex-1][i].stroke.undo();
        }
        this.currStrokeIndex --;
    }

    redo(){
        this.currStrokeIndex ++;
        for(let i = 0; i < this.actionsArr[this.currStrokeIndex-1].length; i++){
            this.actionsArr[this.currStrokeIndex-1][i].stroke.redo();
        }
    }

    getMovingTransform(index){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            if(this.actionsArr[index][i].stroke.scene.name == "strokeHolder" && this.attachScene == this.actionsArr[index][i].stroke.scn ){
                return {
                    pos:this.actionsArr[index][i].stroke.scn.position, 
                    rot:this.actionsArr[index][i].stroke.scn.rotation, 
                    scl:this.actionsArr[index][i].stroke.scn.scale,
                    sub:new Vector3().subVectors(this.actionsArr[index][i].stroke.scn.position, this.actionsArr[index][i].stroke.avgPos)
                };
            }
        }
    }

    updateTransform(index){
        const val = this.getMovingTransform(index);
        for(let i = 0; i < this.actionsArr[index].length; i++){
            if(this.actionsArr[index][i].stroke.scn.name != this.attachScene){
                this.actionsArr[index][i].stroke.scn.position.copy(val.pos);//(param)    
                this.actionsArr[index][i].stroke.scn.rotation.copy(val.rot);
                this.actionsArr[index][i].stroke.scn.scale.copy(val.scl);
            }
        }
    }

    startNewPath(){
        if(this.currStrokeIndex<this.actionsArr.length){//only calls if undo
            const len = this.actionsArr.length - this.currStrokeIndex;
            
            for(let i = 0; i<len; i++){
                const ind = (this.actionsArr.length - 1) - i;

                for(let k = 0; k<this.actionsArr[ind].length; k++){
                    this.actionsArr[ind][k].stroke.killStroke();
                } 
             
            }

            for(let i = 0; i<len; i++){
                this.actionsArr.pop();
            }
        }
    }
    
    updateMatParam(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){ 
            this.actionsArr[index][i].stroke.updateParam( val );
        }
    }

    updateModelInfo(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].stroke.updateModel( { mesh:val.scene, modelInfo : val.modelInfo } );
        }
    }

    updateScaleOffset(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].stroke.updateScale({scale:val});
        }
    }

    offsetScaleKeyPress(index, val){
        let s = 0;
        for(let i = 0; i < this.actionsArr[index].length; i++){
            s = this.actionsArr[index][i].stroke.sclMult + val;
            if(s<0)s=0;
            this.actionsArr[index][i].stroke.updateScale({scale:s});
        }
        return s;
    }
    
    updateRotOffsetX(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].stroke.updateRotX(val);
        }
    }

    updateRotOffsetY(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].stroke.updateRotY(val);
        }
    }

    updateRotOffsetZ(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].stroke.updateRotZ(val);
        }
    }
    getExportData(){
        const arr = [];
        for(let i = 0; i < this.actionsArr.length; i++){
            if(i<this.currStrokeIndex){
                for(let k = 0; k < this.actionsArr[i].length; k++){
                    arr.push(this.actionsArr[i][k].stroke.getExportData());
                }
            }
        }
        return arr;
    }

    getAnis(){
        const arr = [];
        for(let i = 0; i < this.actionsArr.length; i++){
            for(let k = 0; k<this.actionsArr[i].length; k++){
                for(let t = 0; t<this.actionsArr[i][k].stroke.meshes.length; t++){
                    arr.push( this.actionsArr[i][k].stroke.meshes[t].mesh.animations[0] )
                }
            }
        }
        return arr;
    }
    update(OBJ){
        //console.log("arr len = "+this.actionsArr.length);
       // console.log("curr stroke index = "+this.currStrokeIndex);
        for(let i = 0; i < this.actionsArr.length; i++){
            for(let k = 0; k < this.actionsArr[i].length; k++){
              
                this.actionsArr[i][k].stroke.update({delta:OBJ.delta});
            }
        }
    }
   
}

export { ActionHelper };