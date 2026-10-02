import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button.jsx';

const STORAGE_KEY = 'theme';

/** Switches the `dark` class on <html>; the choice is remembered when storage is available. */
export default class ThemeToggle extends React.Component {
  state = { isDark: document.documentElement.classList.contains('dark') };

  toggle = () => {
    const isDark = !this.state.isDark;
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this session.
    }
    this.setState({ isDark });
  };

  render() {
    const { isDark } = this.state;
    const Icon = isDark ? Sun : Moon;
    return (
      <Button variant="ghost" size="icon" onClick={this.toggle} aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
        <Icon aria-hidden="true" />
      </Button>
    );
  }
}
