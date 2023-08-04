import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="App">
      <div>
        <div className="bg-white py-24 sm:py-32">
          <div className="max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Brent Sullivan's Blog
              </h2>
              <p className="mt-2 text-lg leading-8 text-gray-600">
                I'm a founder with several startup flops and one basehit. I
                learn something on every iteration.
              </p>
              <div className="mt-10 space-y-16 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16">
                <article className="max-w-xl flex-col items-start">
                  <div className="flex items-center gap-x-4 text-xs"></div>
                  <div className="group relative">
                    <time className="text-gray-500">Aug 4, 2023</time>
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                      <Link to="/calculator-is-my-startup-viable">
                        Calculator: Is My Startup Viable?
                      </Link>
                    </h3>
                    <ul className="mt-5 text-sm leading-6 text-gray-600 custom-bullets text-left">
                      <li>
                        {" "}
                        A calculator based on{" "}
                        <a
                          className="underline"
                          href="https://longform.asmartbear.com/jason-cohen/"
                        >
                          Jason Cohen's
                        </a>{" "}
                        must-read blog post{" "}
                        <a
                          className="underline"
                          href="https://longform.asmartbear.com/problem/"
                        >
                          Excuse me, is there a problem?
                        </a>
                      </li>
                      <li>
                        Yesterday, my co-founder and I decided to walk away from
                        our revenue-generating startup.
                      </li>
                      <li>
                        After analyzing our target audience, business model, and
                        product using this calculator, it was obvious we were
                        headed in the wrong direction.
                      </li>
                    </ul>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
