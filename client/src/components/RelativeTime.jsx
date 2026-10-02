import React from 'react';
import { formatAbsoluteTime, formatRelativeTime } from '../lib/format.js';

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const SLOW_TICK_MS = 15 * SECOND_MS;

/** A "2s ago" / "2 min ago" label that keeps itself current, with the exact time as a tooltip. */
export default class RelativeTime extends React.Component {
  state = { now: Date.now() };
  timer = null;

  componentDidMount() {
    this.scheduleTick();
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  /** Counts seconds while the entry is under a minute old, then slows down. */
  scheduleTick() {
    const ageMs = Date.now() - new Date(this.props.value).getTime();
    this.timer = setTimeout(() => {
      this.setState({ now: Date.now() });
      this.scheduleTick();
    }, ageMs < MINUTE_MS ? SECOND_MS : SLOW_TICK_MS);
  }

  render() {
    const { value, className } = this.props;
    return (
      <time dateTime={value} title={formatAbsoluteTime(value)} className={className}>
        {formatRelativeTime(value, this.state.now)}
      </time>
    );
  }
}
