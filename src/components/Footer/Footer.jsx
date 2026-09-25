"use client";

import "./Footer.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CONTACT } from "@/lib/contact";

gsap.registerPlugin(ScrollTrigger);


export default function Footer() {

    
    useGSAP(() => {
        
        const scrollTrigger = {
            trigger: ".Footer",
            start: "top 100%",
            end: "bottom bottom",
            scrub: true
        };

        if (window.innerWidth >= 800) {
            gsap.fromTo(".Footer",
                {
                    clipPath: "inset(100% 0 0 0)"
                },
                {
                    clipPath: "inset(0% 0 0 0)",
                    ease: "none",
                    scrollTrigger
                }
            );
        }

        gsap.fromTo(".Bg__blur",
            {
                opacity: 0,
                scale: 1,
                backdropFilter:" blur(0px)",
            },
            {
                opacity: 1,
                backdropFilter:" blur(4px)",
                scale: 1.35,
                ease: "none",
                scrollTrigger: {
                    ...scrollTrigger
                }
            }
        );
    });

    return (
        <>
            <footer className="Footer">
                <div className="Footer__top">
                    <h3 className="Footer__title">
                        Got an idea? Let's work on it together.
                    </h3>
                </div>

                <div className="Footer__links">
                <div className="Footer__link">
                    <a
                        className="Footer__button"
                        href={CONTACT.emailLink}
                    >
                        <div></div>
                        <span>{CONTACT.email}</span>
                    </a>
                </div>

                <div className="Footer__link">
                    <a
                        className="Footer__button"
                        href={CONTACT.upwork}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div></div>
                        <span>upwork</span>
                    </a>
                </div>
                </div>
            </footer>
        </>
    );
}
