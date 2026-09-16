"use client";

import "./Header.css";

export default function Header() {

    return (
        <>
            <header className="Header">
                <span className="Header__title">my portfolio</span>
                <div className="Header__content">
                    <div className="Header__item">
                        <span className="Header__label">gmail</span>
                        <a href="#" className="Header__link">dimokmilok46@gmail.com</a>
                    </div>

                    <div className="Header__item">
                        <span className="Header__label">my freelance</span>
                        <a href="#" className="Header__link">upwork</a>
                    </div>

                    <div className="Header__item">
                        <span className="Header__label">username</span>
                        <a className="Header__value">programistic</a>
                    </div>
                </div>
            </header>
        </>
    );
}