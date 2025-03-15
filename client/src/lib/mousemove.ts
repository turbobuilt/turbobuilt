export const mousegestures = {
    // mousemove: (e: MouseEvent) => {
    //   console.log(e);
    // },
    mousemove: (e: MouseEvent) => {
        console.log("mousemove");
    },
    mouseup: (e: MouseEvent) => {
        console.log("mouseupg");
    },
    mousedown: (e: MouseEvent) => {
        console.log("mousedown");
    }
}

document.addEventListener('mousemove',(e) => mousegestures.mousemove(e));
document.addEventListener('mouseup',(e) => mousegestures.mouseup(e));
document.addEventListener('mousedown',(e) => mousegestures.mousedown(e));
