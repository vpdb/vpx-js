/*
 * VPDB - Virtual Pinball Database
 * Copyright (C) 2019 freezy <freezy@vpdb.io>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { BufferGeometry, ExtrudeBufferGeometry, MeshStandardMaterial, Path, Shape, Vector2 } from 'three';
import { bulbLightMesh } from '../../res/meshes/bulb-light-mesh';
import { bulbSocketMesh } from '../../res/meshes/bulb-socket-mesh';
import { BiffParser } from '../io/biff-parser';
import { Storage } from '../io/ole-doc';
import { DragPoint } from '../math/dragpoint';
import { Matrix3D } from '../math/matrix3d';
import { SplineVertex } from '../math/spline-vertex';
import { Vertex2D } from '../math/vertex2d';
import { GameItem, IRenderable, Meshes } from './game-item';
import { Material } from './material';
import { Table } from './table';

/**
 * VPinball's lights.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/light.cpp
 */
export class LightItem extends GameItem implements IRenderable {

	public static readonly StateOff = 0;
	public static readonly StateOn = 1;
	public static readonly StateBlinking = 2;

	public wzName!: string;
	public vCenter!: Vertex2D;
	public falloff: number = 50;
	public falloffPower: number = 2;
	public state: number = LightItem.StateOff;
	public color: number = 0xffff00;
	public color2: number = 0xffffff;
	public szOffImage?: string;
	public fTimerEnabled: boolean = false;
	public TimerInterval?: number;
	public roundLight: boolean = false;
	public rgblinkpattern?: string;
	public blinkinterval: number = 125;
	public intensity: number = 1;
	public transmissionScale: number = 0;
	public szSurface?: string;
	public fBackglass: boolean = false;
	public depthBias?: number;
	public fadeSpeedUp: number = 0.2;
	public fadeSpeedDown: number = 0.2;
	public BulbLight: boolean = false;
	public imageMode: boolean = false;
	public showBulbMesh: boolean = false;
	public staticBulbMesh: boolean = false;
	public showReflectionOnBall: boolean = true;
	public meshRadius: number = 20;
	public modulateVsAdd: number = 0.9;
	public bulbHaloHeight: number = 28;
	public dragPoints: DragPoint[] = [];

	public static async fromStorage(storage: Storage, itemName: string): Promise<LightItem> {
		const lightItem = new LightItem();
		await storage.streamFiltered(itemName, 4, LightItem.createStreamHandler(lightItem));
		return lightItem;
	}

	private constructor() {
		super();
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(table: Table): boolean {
		return true; // we filter by bulb/playfield light
	}

	/**
	 * Returns whether this light comes with a bulb mesh.
	 */
	public isBulbLight() {
		return this.showBulbMesh && this.meshRadius > 0;
	}

	/**
	 * Returns whether this light is set inside the playfield (but not
	 * a surface)
	 * @param table
	 */
	public isPlayfieldLight(table: Table) {
		return this.isSurfaceLight(table) && !this.szSurface;
	}

	/**
	 * Returns whether this light is either set inside the playfield or another
	 * surface.
	 * @param table
	 */
	public isSurfaceLight(table: Table) {
		if (!this.szOffImage || this.BulbLight) { // in dark knight, we have BulbLight overlays with same texture
			return false;
		}
		if (table.getPlayfieldMap()
			&& this.szOffImage.toLowerCase() === table.getPlayfieldMap().toLowerCase()
			&& this.dragPoints
			&& this.dragPoints.length > 2) {
			return true;
		}

		/*
		 * Sometimes, the texture used for playfield lights is not the same as the
		 * playfield texture, so we need another way to determine whether a light
		 * is inside the playfield or a surface. The rule is currently the
		 * following:
		 *   - First, it needs a texture.
		 *   - If at least four other lights have the same texture, we assume
		 *     it's a match.
		 */
		return table.lights.filter(l => l.szOffImage === this.szOffImage).length > 3;
	}

	public getMeshes(table: Table): Meshes {
		if (this.isBulbLight()) {
			return this.getBulbMeshes(table);
		}
		return {
			surfaceLight: {
				geometry: this.getSurfaceGeometry(table, Table.playfieldThickness / 2),
				map: table.getTexture(this.szOffImage),
			},
		};
	}

	public getShape(table: Table): Shape {
		const vvertex = SplineVertex.getCentralCurve(this.dragPoints, table.getDetailLevel(), -1);
		return this.getPathFromPoints<Shape>(vvertex.map(v => new Vector2(v.x, v.y)), new Shape());
	}

	public getPath(table: Table): Path {
		const vvertex = SplineVertex.getCentralCurve(this.dragPoints, table.getDetailLevel(), -1);
		return this.getPathFromPoints<Path>(vvertex.map(v => new Vector2(v.x, v.y)), new Path());
	}

	// public getExtendedPath(table: Table, distance: number): Path {
	// 	const path = this.getPath(table);
	// 	let len = 0;
	// 	const points: Vector2[] = [];
	// 	const totalLen = path.getLength();
	// 	let i = 0;
	// 	for (const curveLength of path.getCurveLengths()) {
	// 		const tangent = path.getTangent(i);
	// 		const point = path.getPoint(i);
	// 		const direction = tangent.rotateAround(point, M.degToRad(90));
	// 		point.add(direction.multiplyScalar(distance));
	// 		len += curveLength;
	// 		i++;
	// 		points.push(point);
	// 	}
	// 	return this.getPathFromPoints(points);
	// }

	public getSurfaceGeometry(table: Table, depth = 5, bevel = 0.5): ExtrudeBufferGeometry {

		const shape = this.getShape(table);
		const dim = table.getDimensions();
		const invTableWidth = 1.0 / dim.width;
		const invTableHeight = 1.0 / dim.height;

		const geometry = new ExtrudeBufferGeometry(shape, {
			depth,
			bevelEnabled: bevel > 0,
			bevelSegments: 1,
			steps: 1,
			bevelSize: bevel,
			bevelThickness: bevel,
			UVGenerator: {
				generateSideWallUV(g: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number, indexD: number): Vector2[] {
					return [
						new Vector2( 0, 0),
						new Vector2( 0, 0),
						new Vector2( 0, 0),
						new Vector2( 0, 0),
					];
				},
				generateTopUV(g: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number): Vector2[] {
					const ax = vertices[indexA * 3];
					const ay = vertices[indexA * 3 + 1];
					const bx = vertices[indexB * 3];
					const by = vertices[indexB * 3 + 1];
					const cx = vertices[indexC * 3];
					const cy = vertices[indexC * 3 + 1];
					return [
						new Vector2(ax * invTableWidth, 1 - ay * invTableHeight),
						new Vector2(bx * invTableWidth, 1 - by * invTableHeight),
						new Vector2(cx * invTableWidth, 1 - cy * invTableHeight),
					];
				},
			},
		});
		if (this.szSurface) {
			geometry.translate(0, 0, -table.getSurfaceHeight(this.szSurface, 0, 0));
		}
		geometry.name = `surface.light-${this.getName()}`;
		return geometry;
	}

	public postProcessMaterial(table: Table, geometry: BufferGeometry, material: MeshStandardMaterial): MeshStandardMaterial | MeshStandardMaterial[] {
		if (!this.isSurfaceLight(table)) {
			return material;
		}
		material.emissiveMap = material.map;
		material.emissiveIntensity = 0;
		material.emissive.setRGB(50, 50, 50);
		material.opacity = 1;
		return material;
	}

	private getPathFromPoints<T extends Path>(points: Vector2[], path: T): T {
		if (points.length === 0) {
			throw new Error('Cannot get path from no points.');
		}
		path.moveTo(points[0].x, points[0].y);
		for (const v of points.slice(1)) {
			path.lineTo(v.x, v.y);
		}
		path.moveTo(points[0].x, points[0].y);
		return path;
	}

	private getBulbMeshes(table: Table): Meshes {
		const lightMesh = bulbLightMesh.clone(`bulb.light-${this.getName()}`);
		const height = table.getSurfaceHeight(this.szSurface, this.vCenter.x, this.vCenter.y) * table.getScaleZ();
		for (const vertex of lightMesh.vertices) {
			vertex.x = vertex.x * this.meshRadius + this.vCenter.x;
			vertex.y = vertex.y * this.meshRadius + this.vCenter.y;
			vertex.z = vertex.z * this.meshRadius * table.getScaleZ() + height;
		}

		const socketMesh = bulbSocketMesh.clone(`bulb.socket-${this.getName()}`);
		for (const vertex of socketMesh.vertices) {
			vertex.x = vertex.x * this.meshRadius + this.vCenter.x;
			vertex.y = vertex.y * this.meshRadius + this.vCenter.y;
			vertex.z = vertex.z * this.meshRadius * table.getScaleZ() + height;
		}

		const lightMaterial = new Material();
		lightMaterial.cBase = 0;
		lightMaterial.fWrapLighting = 0.5;
		lightMaterial.bOpacityActive = true;
		lightMaterial.fOpacity = 0.2;
		lightMaterial.cGlossy = 0xFFFFFF;
		lightMaterial.bIsMetal = false;
		lightMaterial.fEdge = 1.0;
		lightMaterial.fEdgeAlpha = 1.0;
		lightMaterial.fRoughness = 0.9;
		lightMaterial.fGlossyImageLerp = 1.0;
		lightMaterial.fThickness = 0.05;
		lightMaterial.cClearcoat = 0xFFFFFF;
		lightMaterial.emissiveColor = this.color;
		lightMaterial.emissiveIntensity = 1;

		const socketMaterial = new Material();
		socketMaterial.cBase = 0x181818;
		socketMaterial.fWrapLighting = 0.5;
		socketMaterial.bOpacityActive = false;
		socketMaterial.fOpacity = 1.0;
		socketMaterial.cGlossy = 0xB4B4B4;
		socketMaterial.bIsMetal = false;
		socketMaterial.fEdge = 1.0;
		socketMaterial.fEdgeAlpha = 1.0;
		socketMaterial.fRoughness = 0.9;
		socketMaterial.fGlossyImageLerp = 1.0;
		socketMaterial.fThickness = 0.05;
		socketMaterial.cClearcoat = 0;

		return {
			light: {
				mesh: lightMesh.transform(new Matrix3D().toRightHanded()),
				material: lightMaterial,
			},
			socket: {
				mesh: socketMesh.transform(new Matrix3D().toRightHanded()),
				material: socketMaterial,
			},
		};
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'RADI': this.falloff = this.getFloat(buffer); break;
			case 'FAPO': this.falloffPower = this.getFloat(buffer); break;
			case 'STAT': this.state = this.getInt(buffer); break;
			case 'COLR': this.color = BiffParser.bgrToRgb(this.getInt(buffer)); break;
			case 'COL2': this.color2 = BiffParser.bgrToRgb(this.getInt(buffer)); break;
			case 'IMG1': this.szOffImage = this.getString(buffer, len); break;
			case 'SHAP': this.roundLight = this.getBool(buffer); break;
			case 'BPAT': this.rgblinkpattern = this.getString(buffer, len); break;
			case 'BINT': this.blinkinterval = this.getInt(buffer); break;
			case 'BWTH': this.intensity = this.getFloat(buffer); break;
			case 'TRMS': this.transmissionScale = this.getFloat(buffer); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'BGLS': this.fBackglass = this.getBool(buffer); break;
			case 'LIDB': this.depthBias = this.getFloat(buffer); break;
			case 'FASP': this.fadeSpeedUp = this.getFloat(buffer); break;
			case 'FASD': this.fadeSpeedDown = this.getFloat(buffer); break;
			case 'BULT': this.BulbLight = this.getBool(buffer); break;
			case 'IMMO': this.imageMode = this.getBool(buffer); break;
			case 'SHBM': this.showBulbMesh = this.getBool(buffer); break;
			case 'STBM': this.staticBulbMesh = this.getBool(buffer); break;
			case 'SHRB': this.showReflectionOnBall = this.getBool(buffer); break;
			case 'BMSC': this.meshRadius = this.getFloat(buffer); break;
			case 'BMVA': this.modulateVsAdd = this.getFloat(buffer); break;
			case 'BHHI': this.bulbHaloHeight = this.getFloat(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}

	private static createStreamHandler(lightItem: LightItem) {
		lightItem.dragPoints = [];
		return BiffParser.stream(lightItem.fromTag.bind(lightItem), {
			nestedTags: {
				DPNT: {
					onStart: () => new DragPoint(),
					onTag: dragPoint => dragPoint.fromTag.bind(dragPoint),
					onEnd: dragPoint => lightItem.dragPoints.push(dragPoint),
				},
			},
		});
	}
}
