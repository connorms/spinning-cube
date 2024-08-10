import { Settings } from "./components/Settings";
import { Vec2, Vec3 } from "./util/vector";
import Mat4x4 from "./util/matrix";

export class Triangle {
    constructor(public v0: Vec3 = new Vec3(), public v1: Vec3 = new Vec3(), public v2: Vec3 = new Vec3()) {}

    toMatrix() {
        return new Mat4x4([
            [this.v0.x, this.v0.y, this.v0.z, 0],
            [this.v1.x, this.v1.y, this.v1.z, 0],
            [this.v2.x, this.v2.y, this.v2.z, 0],
            [0, 0, 0, 0],
        ]);
    }
}

class Mesh {
    public triangles: Triangle[];

    constructor() {
        this.triangles = [
            // Front face
            new Triangle(new Vec3(-0.5, -0.5, 0.5), new Vec3(0.5, -0.5, 0.5), new Vec3(0.5, 0.5, 0.5)),
            new Triangle(new Vec3(-0.5, -0.5, 0.5), new Vec3(0.5, 0.5, 0.5), new Vec3(-0.5, 0.5, 0.5)),

            // Back face
            new Triangle(new Vec3(-0.5, -0.5, -0.5), new Vec3(0.5, 0.5, -0.5), new Vec3(0.5, -0.5, -0.5)),
            new Triangle(new Vec3(-0.5, -0.5, -0.5), new Vec3(-0.5, 0.5, -0.5), new Vec3(0.5, 0.5, -0.5)),

            // Top face
            new Triangle(new Vec3(-0.5, 0.5, -0.5), new Vec3(-0.5, 0.5, 0.5), new Vec3(0.5, 0.5, 0.5)),
            new Triangle(new Vec3(-0.5, 0.5, -0.5), new Vec3(0.5, 0.5, 0.5), new Vec3(0.5, 0.5, -0.5)),

            // Bottom face
            new Triangle(new Vec3(-0.5, -0.5, -0.5), new Vec3(0.5, -0.5, 0.5), new Vec3(-0.5, -0.5, 0.5)),
            new Triangle(new Vec3(-0.5, -0.5, -0.5), new Vec3(0.5, -0.5, -0.5), new Vec3(0.5, -0.5, 0.5)),

            // Right face
            new Triangle(new Vec3(0.5, -0.5, -0.5), new Vec3(0.5, 0.5, 0.5), new Vec3(0.5, -0.5, 0.5)),
            new Triangle(new Vec3(0.5, -0.5, -0.5), new Vec3(0.5, 0.5, -0.5), new Vec3(0.5, 0.5, 0.5)),

            // Left face
            new Triangle(new Vec3(-0.5, -0.5, -0.5), new Vec3(-0.5, -0.5, 0.5), new Vec3(-0.5, 0.5, 0.5)),
            new Triangle(new Vec3(-0.5, -0.5, -0.5), new Vec3(-0.5, 0.5, 0.5), new Vec3(-0.5, 0.5, -0.5)),
        ];
    }
}

function toRad(angle: number) {
    return ((angle % 360) * Math.PI) / 180;
}

function addAndWrap(value: number, increment: number, min: number = 0, max: number = 360) {
    let sum = value + increment;
    if (sum < min) sum += max;
    return sum % (max + 1);
}

export default class Renderer {
    public curFrame: string;
    public projMatrix: Mat4x4;
    public cubeRotation: Vec3;
    public camera: Vec3;
    public settings: Settings;
    private luminance: string;

    constructor() {
        this.curFrame = "";

        // default settings
        this.settings = {
            viewSize: new Vec2(84, 84),
            fontSize: 10,
            paused: false,
            step: new Vec3(1, 1, 1),
            rotationSpeed: 5,
            frametime: 15,
            distance: 5,
            execTime: 0,
        };

        let near = 0.1;
        let far = 1000;
        let fov = 90;
        let aspectRatio = this.settings.viewSize.x / this.settings.viewSize.y;
        let fovRad = 1.0 / Math.tan(((fov * 0.5) / 180) * Math.PI);

        this.projMatrix = new Mat4x4([
            [aspectRatio * fovRad, 0, 0, 0],
            [0, fovRad, 0, 0],
            [0, 0, far / (far - near), 1],
            [0, (-far * near) / (far - near), 0, 0],
        ]);

        this.cubeRotation = new Vec3();
        this.camera = new Vec3();

        this.luminance = "`.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
    }

    changeResolution(step: number) {
        this.settings.fontSize += step;

        if (this.settings.fontSize === 0) this.settings.fontSize = 1;

        // Trial and error came to the conclusion that 1.68 was the best multiplier. No idea why...
        this.settings.viewSize.x = Math.ceil((500 / this.settings.fontSize) * 1.68);
        this.settings.viewSize.y = Math.ceil((500 / this.settings.fontSize) * 1.68);
    }

    buildNextFrame() {
        let startTime = performance.now();
        let grid = this.createGrid(this.settings.viewSize.x, this.settings.viewSize.y);

        if (!this.settings.paused) {
            this.cubeRotation.x = addAndWrap(this.cubeRotation.x, this.settings.step.x);
            this.cubeRotation.y = addAndWrap(this.cubeRotation.y, this.settings.step.y);
            this.cubeRotation.z = addAndWrap(this.cubeRotation.z, this.settings.step.z);
        }

        let mesh = new Mesh();

        for (let i = 0; i < mesh.triangles.length; i++) {
            let triMat = mesh.triangles[i].toMatrix();

            // Apply rotation matrices
            triMat = triMat.multiply(Mat4x4.makeRotX(toRad(this.cubeRotation.x)));
            triMat = triMat.multiply(Mat4x4.makeRotY(toRad(this.cubeRotation.y)));
            triMat = triMat.multiply(Mat4x4.makeRotZ(toRad(this.cubeRotation.z)));

            // todo: why is this not working?
            // triMat.values[0][2] = triMat.at(0, 2) + this.settings.distance;
            // triMat.values[1][2] = triMat.at(1, 2) + this.settings.distance;
            // triMat.values[2][2] = triMat.at(2, 2) + this.settings.distance;
            //console.log(triMat.at(0, 2));

            // Use Cross-Product to get surface normal
            // let normal = new Vec3(),
            //     line1 = new Vec3(),
            //     line2 = new Vec3();
            // line1.x = triTranslated.v1.x - triTranslated.v0.x;
            // line1.y = triTranslated.v1.y - triTranslated.v0.y;
            // line1.z = triTranslated.v1.z - triTranslated.v0.z;

            // line2.x = triTranslated.v2.x - triTranslated.v0.x;
            // line2.y = triTranslated.v2.y - triTranslated.v0.y;
            // line2.z = triTranslated.v2.z - triTranslated.v0.z;

            // normal.x = line1.y * line2.z - line1.z * line2.y;
            // normal.y = line1.z * line2.x - line1.x * line2.z;
            // normal.z = line1.x * line2.y - line1.y * line2.x;

            // //It's normally normal to normalise the normal
            // let l = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
            // normal.x /= l;
            // normal.y /= l;
            // normal.z /= l;

            // if (
            //     normal.x * (triTranslated.v0.x - this.camera.x) +
            //         normal.y * (triTranslated.v0.y - this.camera.y) +
            //         normal.z * (triTranslated.v0.z - this.camera.z) <
            //     0
            // ) {
            //let temp = triTranslated.toMatrix();
            triMat = triMat.multiply(this.projMatrix);

            triMat.values[0][0] += 1;
            triMat.values[0][1] += 1;
            triMat.values[1][0] += 1;
            triMat.values[1][1] += 1;
            triMat.values[2][0] += 1;
            triMat.values[2][1] += 1;
            triMat.values[0][0] *= 0.5 * this.settings.viewSize.x;
            triMat.values[0][1] *= 0.5 * this.settings.viewSize.y;
            triMat.values[1][0] *= 0.5 * this.settings.viewSize.x;
            triMat.values[1][1] *= 0.5 * this.settings.viewSize.y;
            triMat.values[2][0] *= 0.5 * this.settings.viewSize.x;
            triMat.values[2][1] *= 0.5 * this.settings.viewSize.y;
            // triMat.values[0][2] = triMat.at(0, 2) + this.settings.distance;
            // triMat.values[1][2] = triMat.at(1, 2) + this.settings.distance;
            // triMat.values[2][2] = triMat.at(2, 2) + this.settings.distance;

            // let light_direction: Vec3 = new Vec3(0, 0, -1);
            // let l = Math.sqrt(light_direction.x * light_direction.x + light_direction.y * light_direction.y + light_direction.z * light_direction.z);
            // light_direction.x /= l;
            // light_direction.y /= l;
            // light_direction.z /= l;

            // let dp = normal.x * light_direction.x + normal.y * light_direction.y + normal.z * light_direction.z;

            // let index = Math.floor(dp * (this.luminance.length - 1));
            // let char = this.luminance.charAt(index);

            let char: string;

            if (i === 0 || i === 1) char = "M";
            else if (i === 2 || i === 3) char = "*";
            else if (i === 4 || i === 5) char = "W";
            else if (i === 6 || i === 7) char = "-";
            else if (i === 8 || i === 9) char = "_";
            else char = "6";

            let triProjected = triMat.toTriangle();
            this.rasterizeTriangle(triProjected, grid, char);
            //}
        }

        this.curFrame = this.gridToString(grid);
        this.settings.execTime = performance.now() - startTime;
    }

    private createGrid(width: number, height: number): string[][] {
        const grid: string[][] = [];
        for (let y = 0; y < height; y++) {
            const row: string[] = [];
            for (let x = 0; x < width; x++) {
                row.push(" ");
            }
            grid.push(row);
        }
        return grid;
    }

    private gridToString(grid: string[][]): string {
        return grid.map((row) => row.join("")).join("\n");
    }

    // private matMul(i: Vec3, o: Vec3, m: Matrix) {
    //     o.x = i.x * m.arr[0][0] + i.y * m.arr[1][0] + i.z * m.arr[2][0] + m.arr[3][0];
    //     o.y = i.x * m.arr[0][1] + i.y * m.arr[1][1] + i.z * m.arr[2][1] + m.arr[3][1];
    //     o.z = i.x * m.arr[0][2] + i.y * m.arr[1][2] + i.z * m.arr[2][2] + m.arr[3][2];
    //     let w = i.x * m.arr[0][3] + i.y * m.arr[1][3] + i.z * m.arr[2][3] + m.arr[3][3];

    //     if (w !== 0) {
    //         o.x /= w;
    //         o.y /= w;
    //         o.z /= w;
    //     }
    // }

    private rasterizeTriangle(triangle: Triangle, grid: string[][], char: string): void {
        let min = new Vec2(
            Math.max(0, Math.floor(Math.min(triangle.v0.x, triangle.v1.x, triangle.v2.x))),
            Math.max(0, Math.floor(Math.min(triangle.v0.y, triangle.v1.y, triangle.v2.y)))
        );

        let max = new Vec2(
            Math.min(this.settings.viewSize.x - 1, Math.ceil(Math.max(triangle.v0.x, triangle.v1.x, triangle.v2.x))),
            Math.min(this.settings.viewSize.y - 1, Math.ceil(Math.max(triangle.v0.y, triangle.v1.y, triangle.v2.y)))
        );

        for (let y = min.y; y <= max.y; y++) {
            for (let x = min.x; x <= max.x; x++) {
                const p = new Vec2(x + 0.5, y + 0.5);
                const w0 = this.edgeFunction(triangle.v1, triangle.v2, p);
                const w1 = this.edgeFunction(triangle.v2, triangle.v0, p);
                const w2 = this.edgeFunction(triangle.v0, triangle.v1, p);

                if (w0 <= 0 && w1 <= 0 && w2 <= 0) {
                    if (grid[y] && grid[y][x]) {
                        grid[y][x] = char;
                    }
                }
            }
        }
    }

    edgeFunction(a: Vec2, b: Vec2, c: Vec2): number {
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    }
}
