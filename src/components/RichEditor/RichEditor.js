import React from 'react';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import LinkControl from './LinkControl';
import DraftLink from './DraftLink';
import {
  convertToRaw,
  CompositeDecorator,
  ContentState,
  Editor,
  EditorState,
  Entity,
  Modifier,
  RichUtils
} from 'draft-js';
import moveSelectionToEnd from '../../utils/draftjs/moveSelectionToEnd';

require('draft-js/dist/Draft.css');
require('./scss/RichEditor.css');

function findLinkEntities(contentBlock, callback) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        Entity.get(entityKey).getType() === 'LINK'
      );
    },
    callback
  );
}

const decorator = new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: DraftLink,
  },
]);

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote': return 'RichEditor-blockquote';
    default: return null;
  }
}

export class RichEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editorState: EditorState.createEmpty(decorator),
      showLinkMenu: false
    };

    this.focus = () => this.refs.editor.focus();
    this.onChange = (editorState) => this.setState({ editorState });
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      console.log(convertToRaw(content));
    };

    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.handleBeforeInput = this._handleBeforeInput.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
    this.toggleLinkStyle = this._toggleLinkStyle.bind(this);
  }

  componentDidMount() {
    this.focus();
  }

  _handleKeyCommand(command) {
    const { editorState } = this.state;
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  //return true to stop the default behaviour
  _handleBeforeInput(char) {
    console.log(/\s/.test(char)); // true when white space is used (space)
  }

  _toggleBlockType(blockType) {
    this.onChange(
      RichUtils.toggleBlockType(
        this.state.editorState,
        blockType
      )
    );
  }

  _toggleInlineStyle(inlineStyle) {
    this.setState({
      showLinkMenu: false
    });

    this.onChange(
      RichUtils.toggleInlineStyle(
        this.state.editorState,
        inlineStyle
      )
    );
  }

  _toggleLinkStyle(newEditorState) {
    this.onChange(newEditorState);
  }

  render() {
    const { editorState, showLinkMenu } = this.state;
    let linkMenu;
    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = 'RichEditor-editor';
    const contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== 'unstyled') {
        className += ' RichEditor-hidePlaceholder';
      }
    }

    return (
      <div className="RichEditor-root" ref="editorRoot">
        <BlockStyleControls
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        <LinkControl
          editorState={editorState}
          onToggle={this.toggleLinkStyle}
        />
        <div className={className} >
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            handleBeforeInput={this.handleBeforeInput}
            onChange={this.onChange}
            placeholder="Tell a story..."
            ref="editor"
            spellCheck={true}
          />
        </div>
      </div>
    );
  }
}

export default RichEditor;
