import React from 'react';

// Custom toolbar for ReactQuill
const QuillCustomToolbar = () => (
    <div id="quill-toolbar">
        <span className="ql-formats">
            <select className="ql-header" defaultValue="" onChange={e => e.persist()}>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="">Normal</option>
            </select>
            <select className="ql-font"></select>
        </span>
        <span className="ql-formats">
            <button className="ql-bold" />
            <button className="ql-italic" />
            <button className="ql-underline" />
            <button className="ql-strike" />
        </span>
        <span className="ql-formats">
            <button className="ql-blockquote" />
            <button className="ql-code-block" />
        </span>
        <span className="ql-formats">
            <button className="ql-list" value="ordered" />
            <button className="ql-list" value="bullet" />
            <button className="ql-indent" value="-1" />
            <button className="ql-indent" value="+1" />
        </span>
        <span className="ql-formats">
            <button className="ql-link" />
            <button className="ql-image" />
            <button className="ql-video" />
        </span>
        <span className="ql-formats">
            <button className="ql-clean" />
        </span>
    </div>
);

export default QuillCustomToolbar; 