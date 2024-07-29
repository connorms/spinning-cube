import { Settings } from "./components/Settings";

class Vec2 {
    constructor(public x: number = 0, public y: number = 0) {}
}

class Vec3 {
    constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}
}

class Triangle {
    constructor(public v0: Vec3 = new Vec3(), public v1: Vec3 = new Vec3(), public v2: Vec3 = new Vec3()) {}
}

class Matrix {
    constructor(public arr: number[][]) {}
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

export default class Renderer {
    public projMatrix: Matrix;
    public theta: number;
    public camera: Vec3;
    public settings: Settings;
    private luminance: string;

    constructor(private viewWidth: number, private viewHeight: number) {
        let fNear = 0.1;
        let fFar = 1000;
        let fFov = 90;
        let fAspectRatio = viewWidth / viewHeight;
        let fFovRad = 1.0 / Math.tan(((fFov * 0.5) / 180) * Math.PI);

        this.projMatrix = new Matrix([
            [fAspectRatio * fFovRad, 0, 0, 0],
            [0, fFovRad, 0, 0],
            [0, 0, fFar / (fFar - fNear), 1],
            [0, (-fFar * fNear) / (fFar - fNear), 0, 0],
        ]);

        this.theta = 0;
        this.camera = new Vec3(0, 0, 0);
        this.luminance = "`.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";

        // default settings
        this.settings = {
            paused: false,
            thetaX: 0,
            thetaY: 0,
            thetaZ: 0,
            rotationSpeed: 5,
            frametime: 50,
            delta: 5,
        };
    }

    buildNextFrame() {
        let grid = this.createGrid(this.viewWidth, this.viewHeight);

        if (!this.settings.paused) {
            this.theta += ((this.settings.delta % 360) * Math.PI) / 180;
            this.updateSettings({ thetaX: ((this.theta * 180) / Math.PI) % 360 });
        }

        let rotX = new Matrix([
            [1, 0, 0, 0],
            [0, Math.cos(this.theta), -Math.sin(this.theta), 0],
            [0, Math.sin(this.theta), Math.cos(this.theta), 0],
            [0, 0, 0, 0],
        ]);

        let rotY = new Matrix([
            [Math.cos(this.theta), 0, Math.sin(this.theta), 0],
            [0, 1, 0, 0],
            [-Math.sin(this.theta), 0, Math.cos(this.theta), 0],
            [0, 0, 0, 0],
        ]);

        let rotZ = new Matrix([
            [Math.cos(this.theta), -Math.sin(this.theta), 0, 0],
            [Math.sin(this.theta), Math.cos(this.theta), 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0],
        ]);

        let mesh = new Mesh();

        //let triangles1: Triangle[] = new Array<Triangle>();

        for (let i = 0; i < mesh.triangles.length; i++) {
            let triProjected: Triangle = new Triangle(),
                triTranslated: Triangle = new Triangle(),
                triRotatedX: Triangle = new Triangle(),
                triRotatedXY: Triangle = new Triangle(),
                triRotatedXYZ: Triangle = new Triangle();

            let triangle = mesh.triangles[i];

            const mult = 2;

            triangle.v0.x *= mult;
            triangle.v0.y *= mult;
            triangle.v0.z *= mult;
            triangle.v1.x *= mult;
            triangle.v1.y *= mult;
            triangle.v1.z *= mult;
            triangle.v2.x *= mult;
            triangle.v2.y *= mult;
            triangle.v2.z *= mult;

            this.matMul(triangle.v0, triRotatedX.v0, rotX);
            this.matMul(triangle.v1, triRotatedX.v1, rotX);
            this.matMul(triangle.v2, triRotatedX.v2, rotX);

            this.matMul(triRotatedX.v0, triRotatedXY.v0, rotY);
            this.matMul(triRotatedX.v1, triRotatedXY.v1, rotY);
            this.matMul(triRotatedX.v2, triRotatedXY.v2, rotY);

            this.matMul(triRotatedXY.v0, triRotatedXYZ.v0, rotZ);
            this.matMul(triRotatedXY.v1, triRotatedXYZ.v1, rotZ);
            this.matMul(triRotatedXY.v2, triRotatedXYZ.v2, rotZ);

            triTranslated = triRotatedXYZ;
            triTranslated.v0.z = triRotatedXYZ.v0.z + 3.0;
            triTranslated.v1.z = triRotatedXYZ.v1.z + 3.0;
            triTranslated.v2.z = triRotatedXYZ.v2.z + 3.0;

            // Use Cross-Product to get surface normal
            let normal = new Vec3(),
                line1 = new Vec3(),
                line2 = new Vec3();
            line1.x = triTranslated.v1.x - triTranslated.v0.x;
            line1.y = triTranslated.v1.y - triTranslated.v0.y;
            line1.z = triTranslated.v1.z - triTranslated.v0.z;

            line2.x = triTranslated.v2.x - triTranslated.v0.x;
            line2.y = triTranslated.v2.y - triTranslated.v0.y;
            line2.z = triTranslated.v2.z - triTranslated.v0.z;

            normal.x = line1.y * line2.z - line1.z * line2.y;
            normal.y = line1.z * line2.x - line1.x * line2.z;
            normal.z = line1.x * line2.y - line1.y * line2.x;

            //It's normally normal to normalise the normal
            let l = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
            normal.x /= l;
            normal.y /= l;
            normal.z /= l;

            if (
                normal.x * (triTranslated.v0.x - this.camera.x) +
                    normal.y * (triTranslated.v0.y - this.camera.y) +
                    normal.z * (triTranslated.v0.z - this.camera.z) <
                0
            ) {
                this.matMul(triTranslated.v0, triProjected.v0, this.projMatrix);
                this.matMul(triTranslated.v1, triProjected.v1, this.projMatrix);
                this.matMul(triTranslated.v2, triProjected.v2, this.projMatrix);

                triProjected.v0.x += 1.0;
                triProjected.v0.y += 1;
                triProjected.v1.x += 1.0;
                triProjected.v1.y += 1;
                triProjected.v2.x += 1.0;
                triProjected.v2.y += 1;
                triProjected.v0.x *= 0.5 * this.viewWidth;
                triProjected.v0.y *= 0.5 * this.viewHeight;
                triProjected.v1.x *= 0.5 * this.viewWidth;
                triProjected.v1.y *= 0.5 * this.viewHeight;
                triProjected.v2.x *= 0.5 * this.viewWidth;
                triProjected.v2.y *= 0.5 * this.viewHeight;

                let light_direction: Vec3 = new Vec3(0, 0, -1);
                let l = Math.sqrt(
                    light_direction.x * light_direction.x + light_direction.y * light_direction.y + light_direction.z * light_direction.z
                );
                light_direction.x /= l;
                light_direction.y /= l;
                light_direction.z /= l;

                let dp = normal.x * light_direction.x + normal.y * light_direction.y + normal.z * light_direction.z;

                let index = Math.floor(dp * (this.luminance.length - 1));
                let char = this.luminance.charAt(index);

                // let char: string;

                // if (i === 0 || i === 1) char = "M";
                // else if (i === 2 || i === 3) char = "*";
                // else if (i === 4 || i === 5) char = "W";
                // else if (i === 6 || i === 7) char = "-";
                // else if (i === 8 || i === 9) char = "_";
                // else char = "6"

                this.rasterizeTriangle(triProjected, grid, char);
            }
        }

        return this.gridToString(grid);
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

    private matMul(i: Vec3, o: Vec3, m: Matrix) {
        o.x = i.x * m.arr[0][0] + i.y * m.arr[1][0] + i.z * m.arr[2][0] + m.arr[3][0];
        o.y = i.x * m.arr[0][1] + i.y * m.arr[1][1] + i.z * m.arr[2][1] + m.arr[3][1];
        o.z = i.x * m.arr[0][2] + i.y * m.arr[1][2] + i.z * m.arr[2][2] + m.arr[3][2];
        let w = i.x * m.arr[0][3] + i.y * m.arr[1][3] + i.z * m.arr[2][3] + m.arr[3][3];

        if (w !== 0) {
            o.x /= w;
            o.y /= w;
            o.z /= w;
        }
    }

    private rasterizeTriangle(triangle: Triangle, grid: string[][], char: string): void {
        let minX = Math.max(0, Math.floor(Math.min(triangle.v0.x, triangle.v1.x, triangle.v2.x)));
        let maxX = Math.min(this.viewWidth - 1, Math.ceil(Math.max(triangle.v0.x, triangle.v1.x, triangle.v2.x)));
        let minY = Math.max(0, Math.floor(Math.min(triangle.v0.y, triangle.v1.y, triangle.v2.y)));
        let maxY = Math.min(this.viewHeight - 1, Math.ceil(Math.max(triangle.v0.y, triangle.v1.y, triangle.v2.y)));

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const p = new Vec2(x + 0.5, y + 0.5);
                const w0 = this.edgeFunction(triangle.v1, triangle.v2, p);
                const w1 = this.edgeFunction(triangle.v2, triangle.v0, p);
                const w2 = this.edgeFunction(triangle.v0, triangle.v1, p);
                if (w0 <= 0 && w1 <= 0 && w2 <= 0) {
                    if (grid[y] && grid[y][x]) {
                        grid[y][x] = char;

                        // if (Math.round(x) === v0.x && Math.round(y) === v0.y) {
                        //     grid[Math.round(y)][Math.round(x)] = "0";
                        // }
                        // if (Math.round(x) === v1.x && Math.round(y) === v1.y) {
                        //     grid[Math.round(y)][Math.round(x)] = "1";
                        // }
                        // if (Math.round(x) === v2.x && Math.round(y) === v2.y) {
                        //     grid[Math.round(y)][Math.round(x)] = "2";
                        // }
                    }
                }
            }
        }

        //grid[triangle.origin().y][triangle.origin().x] = "X";
    }

    private edgeFunction(a: Vec2, b: Vec2, c: Vec2): number {
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    }

    updateSettings(newSettings: { [key: string]: any }) {
        this.settings = { ...this.settings, ...newSettings };
    }
}
