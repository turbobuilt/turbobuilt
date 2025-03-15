<script>
// import content from "./loader.html?raw"

// // import { MyFileSystemProvider } from './fileSystemProvider';

// // const myFileSystemProvider = new MyFileSystemProvider();
// // vscode.workspace.registerFileSystemProvider('myfs', myFileSystemProvider, { isCaseSensitive: true });


// export default {
//     mounted() {
//         // JavaScript function to inject HTML content into the iframe
//         function injectContent() {
//             var iframe = document.getElementById('myIframe');
//             var doc = iframe.contentDocument || iframe.contentWindow.document;

//             // HTML content we want to inject
//             doc.open();
//             doc.write(content);
//             doc.close();
//         }

//         // Call the function to inject content
//         injectContent();
//     }
// }    


</script>
<template>
    VSCODE
    <iframe class="vue-iframe" id="myIframe"></iframe>
</template>
<style lang="scss">
.vue-iframe {
    border: none;
    height: 500px;
}
</style>