import React from "react";
import PropTypes from "prop-types";
import {Share} from "react-twitter-widgets";

export default class ShareBox extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      expanded: this.props.expanded,
    };
  }
  render() {
    const {url, text, hashtags} = this.props;
    
    let shareComponent = null;
    
    if (this.state.expanded) {
      shareComponent = <Share url={url} options={{text, hashtags}} />;
    }
    
    return <div className="share-box">
      {shareComponent}
    </div>;
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.expanded) {
      this.setState({expanded: true});
    }
  }
}
ShareBox.propTypes = {
  url: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  hashtags: PropTypes.string.isRequired,
  expanded: PropTypes.bool.isRequired,
};
