"use client";

import React, { useEffect, useRef } from "react";
import "./About.css";
import { CONTACT } from "@/lib/contact";

export default function About() {
    const section = useRef(null);

    useEffect(() => {

    }, []);

    return (
        <div ref={section} className="Info-me">
            <section className="Bio">
                <div className="Bio__cell"></div>
                <div className="Bio__cell"></div>
                <div className="Bio__cell"></div>
                <div className="Bio__cell"></div>

                <div className="Bio__cell Bio-text">
                    <h2>BIO</h2>

                    <div className="Bio__info">
                        <ul className="Bio__labels">
                            <li>name</li>
                            <li>age</li>
                            <li>born in</li>
                            <li>based</li>
                        </ul>

                        <ul className="Bio__values">
                            <li>dmytro</li>
                            <li>20</li>
                            <li>ukraine</li>
                            <li>ukraine (temp.)</li>
                        </ul>
                    </div>
                </div>

                <div className="Bio__cell"></div>
            </section>

            <section className="About">
                <div className="About__cell">
                    <h2>About Me</h2>
                    <p>
                        Information written <br />
                        <span>07.07.2026</span>
                    </p>
                </div>

                <div className="About__cell"></div>

                <div className="About__cell">
                    <p>
                        Over 1500 h+ of commercial experience, working in a team, agency, and directly with clients. Actively striving to be the best in my field by following the latest trends and continuously improving myself every day
                    </p>

                    <div>
                        <p>My Freelance</p>
                        <a
                            href={CONTACT.upwork}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            upwork
                        </a>
                    </div>
                </div>

                <div className="About__cell">
                    <span>overview</span>

                    <div>
                        <p>
                            I work with clients from all over the world, adapting to their preferences and the required website style
                        </p>

                        <p>
                            Throughout my entire career, I have never received a rating below 5 stars — something I’m proud of and strive to maintain
                        </p>
                    </div>
                </div>

                <div className="About__cell">
                    <span>
                        creative services <br />
                        i offer
                    </span>

                    <ul>
                        <li>Product Design</li>
                        <li>Web Design</li>
                        <li>UX/UI Design</li>
                        <li>SEO, Front-End</li>
                    </ul>
                </div>

                <div className="About__cell"></div>
                <div className="About__cell"></div>
                <div className="About__cell"></div>
                <div className="About__cell"></div>
            </section>

            <section className="Approach">
                <div className="Approach__cell"></div>

                <div className="Approach__cell">
                    <h2>My Approach</h2>
                </div>

                <div className="Approach__cell"></div>

                <div className="Approach__cell Approach-text">
                    <div>
                        <p>preparation</p>
                        <p>
                            A clear understanding of the project, its goals, and direction. You get a solid foundation with the structure, priorities, and key interactions defined from the start
                        </p>
                    </div>
                    <span>01</span>
                </div>

                <div className="Approach__cell Approach-text">
                    <div>
                        <p>design</p>
                        <p>
                            A cohesive visual system built around your brand and goals. You get more than a good-looking layout — every composition, typeface, and interaction has a clear purpose
                        </p>
                    </div>
                    <span>02</span>
                </div>

                <div className="Approach__cell Approach-text">
                    <div>
                        <p>development</p>
                        <p>
                            A finished website that stays true to the original vision. You get a clean, responsive build with smooth animations and careful attention to performance across every device
                        </p>
                    </div>
                    <span>03</span>
                </div>
            </section>
        </div>
    );
}
