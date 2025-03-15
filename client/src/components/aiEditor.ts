import { serverMethods } from "@/lib/serverMethods";
import { convertImageToWebP, getImageData } from "@/pages/upload/uploadUtilities";
import { uploadGeneratedFile } from "./uploadFiles";
import { showAlert } from "./ShowModal/showModal";

export const systemMessage = `You are a coding bot who creates new or edits copies of vue sfc components.

You will receive the user's request, and a copy of one or more files with each line number prepended to each line for reference.

Your coding style is you first have <script setup lang="ts">, then the <template>, then <style lang="scss">. Your components have a root div, that has a css class, and all sass is nested under that one class. You will receive a prompt, and the contents of the current file (which may be blank). 

First you begin the response with a message explaining what you will do or answering the user's question. If the user is asking you to do something, you continue the response, returning the needed file edits like this:

<turbobuilt_file_edit path="/path/to/file">
<insert after-line="10">
{some code, multiline allowed}
</insert>
<insert before-line="1"> // you would use this if the file is empty
{some code, multiline allowed}
</insert>
<delete from-line="5" through-line="10"></delete> // delete lines 5 to 10, inclusive of both
<delete line="11"></delete> // delete just line 11
<replace from-line="5" through-line="10"> // replace lines 5-10 inclusive on both sides.
{some code, multiline allowed}
</replace>
<replace line="11"> // replace just line 11 with the following
{some code, multiline allowed}
</replace>
</turbobuilt_file_edit>

Keep in mind, all line numbers you return must be in reference to the file you received, which has line numbers prepended to each line.
If you add or remove a few lines, and then insert later, the insert line numbers are based on the original file, not the one with the added or removed lines.
All inserts/edits MUST be in ascending order.
Make sure to have appropriate whitespace for indentation.

Oftentimes, the template code you generate should have images for maximum beauty.  When you think an image is appropriate in the template, you need to put in a special syntax which I will postprocess later for the src or background-image property.  For example:

<img short-description="{short description}" description="{descriptive image generation prompt}" >

.background { 
background: url('[IMAGE short-description='background']A beautiful sunny day[/IMAGE]') center/cover no-repeat;
}

Images will be 1024px by 1024px.  You can put these [IMAGE] tags anywhere in the whole file including template or style and they will get generated and replaced with the actual generated image url`;

export async function processMessage(fullMessage: string, complete: boolean, responseMessage, fileContents, updateFileInEditor, d) {
    console.log(fullMessage)

    // Extract turbobuilt_file_edit blocks from the response
    const fileEditRegex = /<turbobuilt_file_edit path="([^"]+)">([\s\S]*?)(<\/turbobuilt_file_edit>|$)/g;
    const matches = Array.from(fullMessage.matchAll(fileEditRegex));

    // Update the responseMessage to display clean text in chat window
    if (responseMessage) {
        let cleanMessage = fullMessage;

        // Replace each file edit block with a simple "Editing [filepath]" message
        matches.forEach(match => {
            const filePath = match[1];
            cleanMessage = cleanMessage.replace(match[0], `\n\nEditing ${filePath.split("/").slice(2).join("/")}`);
        });

        // Update the response message content
        responseMessage.content = cleanMessage;
    }

    if (matches.length > 0) {
        for (const match of matches) {
            const editContent = match[2];
            const filePath = match[1];
            const isComplete = match[0].endsWith('</turbobuilt_file_edit>');

            // Parse the content of the file being edited
            let fileContentLines = fileContents.split('\n');

            // Extract all operations
            const operations = [];

            // Helper function to process content and handle whitespace correctly
            function processContent(content, isCompleteOp) {
                // Remove the first newline if it exists and trim the last newline
                content = content.replace(/^\n/, '').replace(/\n$/, '');

                if (!isCompleteOp && !complete) {
                    content += "\n// ...editing...";
                }
                return content;
            }

            // Insert after line - handles incomplete tags
            const insertAfterRegex = /<insert after-line="(\d+)">([\s\S]*?)(<\/insert>|$)/g;
            let insertMatches = Array.from(editContent.matchAll(insertAfterRegex));
            for (const insertMatch of insertMatches) {
                const lineNumber = parseInt(insertMatch[1]);
                const content = processContent(insertMatch[2], insertMatch[0].endsWith('</insert>'));
                const isCompleteOp = insertMatch[0].endsWith('</insert>');
                operations.push({ type: 'insertAfter', line: lineNumber, content, isCompleteOp });
            }

            // Insert before line - handles incomplete tags
            const insertBeforeRegex = /<insert before-line="(\d+)">([\s\S]*?)(<\/insert>|$)/g;
            insertMatches = Array.from(editContent.matchAll(insertBeforeRegex));
            for (const insertMatch of insertMatches) {
                const lineNumber = parseInt(insertMatch[1]);
                const content = processContent(insertMatch[2], insertMatch[0].endsWith('</insert>'));
                const isCompleteOp = insertMatch[0].endsWith('</insert>');
                operations.push({ type: 'insertBefore', line: lineNumber, content, isCompleteOp });
            }

            // Delete lines - handles incomplete tags
            const deleteRegex = /<delete from-line="(\d+)" through-line="(\d+)">(<\/delete>|$)/g;
            const deleteMatches = Array.from(editContent.matchAll(deleteRegex));
            for (const deleteMatch of deleteMatches) {
                const fromLine = parseInt(deleteMatch[1]);
                const throughLine = parseInt(deleteMatch[2]);
                const isCompleteOp = deleteMatch[0].endsWith('</delete>');
                operations.push({ type: 'delete', fromLine, throughLine, isCompleteOp });
            }

            // Delete single line - handles incomplete tags
            const deleteSingleLineRegex = /<delete line="(\d+)">(<\/delete>|$)/g;
            const deleteSingleLineMatches = Array.from(editContent.matchAll(deleteSingleLineRegex));
            for (const deleteMatch of deleteSingleLineMatches) {
                const line = parseInt(deleteMatch[1]);
                const isCompleteOp = deleteMatch[0].endsWith('</delete>');
                operations.push({ type: 'deleteSingle', line, isCompleteOp });
            }

            // Replace range - handles incomplete tags
            const replaceRangeRegex = /<replace from-line="(\d+)" through-line="(\d+)">([\s\S]*?)(<\/replace>|$)/g;
            const replaceRangeMatches = Array.from(editContent.matchAll(replaceRangeRegex));
            for (const replaceMatch of replaceRangeMatches) {
                const fromLine = parseInt(replaceMatch[1]);
                const throughLine = parseInt(replaceMatch[2]);
                const content = processContent(replaceMatch[3], replaceMatch[0].endsWith('</replace>'));
                const isCompleteOp = replaceMatch[0].endsWith('</replace>');
                operations.push({ type: 'replaceRange', fromLine, throughLine, content, isCompleteOp });
            }

            // Replace single line - handles incomplete tags
            const replaceLineRegex = /<replace line="(\d+)">([\s\S]*?)(<\/replace>|$)/g;
            const replaceLineMatches = Array.from(editContent.matchAll(replaceLineRegex));
            for (const replaceMatch of replaceLineMatches) {
                const line = parseInt(replaceMatch[1]);
                const content = processContent(replaceMatch[2], replaceMatch[0].endsWith('</replace>'));
                const isCompleteOp = replaceMatch[0].endsWith('</replace>');
                operations.push({ type: 'replaceLine', line, content, isCompleteOp });
            }

            // Sort operations by line number in descending order (bottom to top)
            operations.sort((a, b) => {
                const aLine = a.line || a.fromLine;
                const bLine = b.line || b.fromLine;
                return bLine - aLine;
            });

            // Apply operations in order (from bottom to top)
            for (const op of operations) {
                switch (op.type) {
                    case 'insertAfter': {
                        const actualLine = op.line;
                        const contentToInsert = op.content.split('\n');
                        fileContentLines.splice(actualLine, 0, ...contentToInsert);
                        break;
                    }
                    case 'insertBefore': {
                        const actualLine = op.line - 1;
                        const contentToInsert = op.content.split('\n');
                        fileContentLines.splice(actualLine, 0, ...contentToInsert);
                        break;
                    }
                    case 'delete': {
                        const actualFromLine = op.fromLine - 1;
                        const actualThroughLine = op.throughLine;
                        const linesToDelete = actualThroughLine - actualFromLine;
                        fileContentLines.splice(actualFromLine, linesToDelete);
                        break;
                    }
                    case 'deleteSingle': {
                        const actualLine = op.line - 1;
                        fileContentLines.splice(actualLine, 1);
                        break;
                    }
                    case 'replaceRange': {
                        const actualFromLine = op.fromLine - 1;
                        const actualThroughLine = op.throughLine;
                        const linesToReplace = actualThroughLine - actualFromLine;
                        const contentToInsert = op.content.split('\n');
                        fileContentLines.splice(actualFromLine, linesToReplace, ...contentToInsert);
                        break;
                    }
                    case 'replaceLine': {
                        const actualLine = op.line - 1;
                        const contentToInsert = op.content.split('\n');
                        fileContentLines.splice(actualLine, 1, ...contentToInsert);
                        break;
                    }
                }
            }

            // Join the lines back into a single string
            fileContents = fileContentLines.join('\n');

            // Update the file in the editor immediately
            setTimeout(() => {
                updateFileInEditor(filePath, fileContents);
            }, 100);
        }
    }

}
