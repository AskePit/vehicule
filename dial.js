import { clamp, remap } from './physics.js';

export class Dial {
    SIZE = 180;

    constructor(div, minValue = 0, maxValue = 200, minDegree = -135, maxDegree = 135, startValue = 0, minorTickStep = 10, majorTickStep = 20) {
        this.#div = div
        this.#setupDiv();
        this.#minValue = minValue;
        this.#maxValue = maxValue;
        this.#minDegree = minDegree * Math.PI / 180;
        this.#maxDegree = maxDegree * Math.PI / 180;
        this.#minorTickStep = minorTickStep;
        this.#majorTickStep = majorTickStep;

        this.value = startValue
    }

    #setupDiv() {
        this.#canvas = document.createElement("canvas");
        this.#ctx = this.#canvas.getContext('2d');

        this.#canvas.width = this.SIZE;
        this.#canvas.height = this.SIZE;

        this.#canvas.style.width = this.#canvas.width + "px";
        this.#canvas.style.height = this.#canvas.height + "px";

        this.#div.style.width = this.#canvas.style.width;
        this.#div.style.height = this.#canvas.style.height;

        this.#div.appendChild(this.#canvas);
    }

    get value() {
        return this.#value
    }

    set value(x) {
        this.#value = clamp(x, this.#minValue, this.#maxValue)
    }

    get degree() {
        return remap(this.#value, this.#minValue, this.#maxValue, this.#minDegree, this.#maxDegree)
    }

    set degree(x) {
        this.value = remap(x, this.#minDegree, this.#maxDegree, this.#minValue, this.#maxValue)
    }

    render() {
        const ctx = this.#ctx;
        const size = this.SIZE;

        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, this.#minDegree - Math.PI / 2, this.#maxDegree - Math.PI / 2);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        const numTicks = Math.floor((this.#maxValue - this.#minValue) / this.#minorTickStep) + 1;
        const minorTickLength = 6;
        const majorTickLength = 10;
        const minorTickWidth = 2;
        const majorTickWidth = 2;
        ctx.save();
        ctx.translate(size / 2, size / 2);
        for (let i = 0; i < numTicks; i++) {
            const value = this.#minValue + i * this.#minorTickStep;
            const angle = remap(value, this.#minValue, this.#maxValue, this.#minDegree, this.#maxDegree);
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            if (value % this.#majorTickStep === 0) {
                ctx.moveTo(0, -(size / 2 - 2));
                ctx.lineTo(0, -(size / 2 - 2 - majorTickLength));
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = majorTickWidth;
                ctx.font = "11px monospace";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                const labelRadius = -(size / 2 - 2 - majorTickLength - 12);
                ctx.save();
                ctx.translate(0, labelRadius);
                ctx.rotate(-angle);
                ctx.fillText(value.toString(), 0, 0);
                ctx.restore();
            } else {
                ctx.moveTo(0, -(size / 2 - 2));
                ctx.lineTo(0, -(size / 2 - 2 - minorTickLength));
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = minorTickWidth;
            }
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        const angle = this.degree - Math.PI / 2;

        const arrowLength = size / 2 - 20;

        const centerX = size / 2;
        const centerY = size / 2;
        const BUMP_SIZE = 5;
        const BUMP_ANGLE = Math.PI / 6;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + BUMP_SIZE * Math.cos(angle - BUMP_ANGLE),
            centerY + BUMP_SIZE * Math.sin(angle - BUMP_ANGLE)
        );
        ctx.lineTo(
            centerX + arrowLength * Math.cos(angle),
            centerY + arrowLength * Math.sin(angle)
        );
        ctx.lineTo(
            centerX + BUMP_SIZE * Math.cos(angle + BUMP_ANGLE),
            centerY + BUMP_SIZE * Math.sin(angle + BUMP_ANGLE)
        );
        ctx.lineTo(centerX, centerY);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    #div = null
    #canvas = null
    #ctx = null

    #minDegree
    #maxDegree

    #minValue = 0
    #maxValue = 200

    #minorTickStep = 10
    #majorTickStep = 20

    #value = 0
}
