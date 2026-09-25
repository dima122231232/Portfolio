"use client";

import "./Header.css";
import { CONTACT } from "@/lib/contact";

export default function Header() {

    return (
        <>
            <header className="Header">
                <span className="Header__title">my portfolio</span>
                <div className="Header__content">
                    <div className="Header__item">
                        <span className="Header__label">gmail</span>
                        <a
                            href={CONTACT.emailLink}
                            className="Header__link"
                        >
                            {CONTACT.email}
                        </a>
                    </div>

                    <div className="Header__item">
                        <span className="Header__label">my freelance</span>
                        <a
                            href={CONTACT.upwork}
                            className="Header__link"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            upwork
                        </a>
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