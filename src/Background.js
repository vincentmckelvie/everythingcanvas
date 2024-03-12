import {
    ConeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Euler,
    Mesh,
    SphereGeometry,
    ShaderMaterial,
    Color,
    BackSide
} from './build/three.module.js';

class Background {
    
    constructor(OBJ){
        const self = this;
        const vertexShader = self.getBgVertex();
		const fragmentShader = self.getBgFragment();
		this.param = {
			top:new Color(0x333333),
			bottom:new Color(0x333333),
			size:.9,
			offset:0
		}
		const uniforms = {
			topColor: { value: new Color(0x333333) },
			bottomColor: { value: new Color(0x333333) },
			offset: { value: 0 },
			exponent: { value: 0.9 }
		};

		//uniforms.topColor.value.copy( light.color );

		const skyGeo = new SphereGeometry( 500, 12, 12 );
		const skyMat = new ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			side: BackSide
		} );

		this.sky = new Mesh( skyGeo, skyMat );
		OBJ.scene.add(this.sky);

      
    }

	update(OBJ){
		this.param = OBJ;
		if(this.sky.material.uniforms!=null){
			this.sky.material.uniforms.topColor.value = OBJ.top;
			this.sky.material.uniforms.bottomColor.value = OBJ.bottom;
			this.sky.material.uniforms.exponent.value = OBJ.size;
			this.sky.material.uniforms.offset.value = OBJ.offset;
			this.sky.material.uniforms.uniformsNeedUpdate = true;
		}
	}

    getBgVertex(){
		const str = [
				
			'varying vec3 vWorldPosition;',
			'void main() {',
				'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
				'vWorldPosition = worldPosition.xyz;',
				'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
			'}',
			
		].join( '\n' );
		return str;
	}
	getBgFragment(){
		const str = [
			'uniform vec3 topColor;',
			'uniform vec3 bottomColor;',
			'uniform float offset;',
			'uniform float exponent;',
			'varying vec3 vWorldPosition;',

			'void main() {',
				'float h = normalize( vec3(vWorldPosition.x, vWorldPosition.y + offset, vWorldPosition.z) ).y;',
				'gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );',
			'}',
			
		].join( '\n' );
		return str;
	}

	getExportData(){
		return {
			top:this.param.top.getHexString(),
			bottom:this.param.bottom.getHexString(),
			size:this.param.size,
			offset:this.param.offset
		};
	}


}

export { Background };