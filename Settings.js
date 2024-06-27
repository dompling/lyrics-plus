const ButtonSVG = ({icon, active = true, onClick}) => {
    return react.createElement(
        "button",
        {
            className: `switch${active ? "" : " disabled"}`,
            onClick
        },
        react.createElement("svg", {
            width: 16,
            height: 16,
            viewBox: "0 0 16 16",
            fill: "currentColor",
            dangerouslySetInnerHTML: {
                __html: icon
            }
        })
    );
};

const SwapButton = ({icon, disabled, onClick}) => {
    return react.createElement(
        "button",
        {
            className: "switch small",
            onClick,
            disabled
        },
        react.createElement("svg", {
            width: 10,
            height: 10,
            viewBox: "0 0 16 16",
            fill: "currentColor",
            dangerouslySetInnerHTML: {
                __html: icon
            }
        })
    );
};

const CacheButton = () => {
    let lyrics = {};

    try {
        const localLyrics = JSON.parse(localStorage.getItem("lyrics-plus:local-lyrics"));
        if (!localLyrics || typeof localLyrics !== "object") {
            throw "";
        }
        lyrics = localLyrics;
    } catch {
        lyrics = {};
    }

    const [count, setCount] = useState(Object.keys(lyrics).length);
    const text = count ? "Clear cached lyrics" : "No cached lyrics";

    return react.createElement(
        "button",
        {
            className: "btn",
            onClick: () => {
                localStorage.removeItem("lyrics-plus:local-lyrics");
                setCount(0);
            },
            disabled: !count
        },
        text
    );
};

const RefreshTokenButton = ({setTokenCallback}) => {
    const [buttonText, setButtonText] = useState("Refresh token");

    useEffect(() => {
        if (buttonText === "Refreshing token...") {
            Spicetify.CosmosAsync.get("https://apic-desktop.musixmatch.com/ws/1.1/token.get?app_id=web-desktop-app-v1.0", null, {
                authority: "apic-desktop.musixmatch.com"
            })
                .then(({message: response}) => {
                    if (response.header.status_code === 200 && response.body.user_token) {
                        setTokenCallback(response.body.user_token);
                        setButtonText("Token refreshed");
                    } else if (response.header.status_code === 401) {
                        setButtonText("Too many attempts");
                    } else {
                        setButtonText("Failed to refresh token");
                        console.error("Failed to refresh token", response);
                    }
                })
                .catch(error => {
                    setButtonText("Failed to refresh token");
                    console.error("Failed to refresh token", error);
                });
        }
    }, [buttonText]);

    return react.createElement(
        "button",
        {
            className: "btn",
            onClick: () => {
                setButtonText("Refreshing token...");
            },
            disabled: buttonText !== "Refresh token"
        },
        buttonText
    );
};

const ConfigSlider = ({name, defaultValue, onChange = () => {}}) => {
    const [active, setActive] = useState(defaultValue);

    const toggleState = useCallback(() => {
        const state = !active;
        setActive(state);
        onChange(state);
    }, [active]);

    return react.createElement(
        "div",
        {
            className: "setting-row"
        },
        react.createElement(
            "label",
            {
                className: "col description"
            },
            name
        ),
        react.createElement(
            "div",
            {
                className: "col action"
            },
            react.createElement(ButtonSVG, {
                icon: Spicetify.SVGIcons.check,
                active,
                onClick: toggleState
            })
        )
    );
};

const ConfigSelection = ({name, defaultValue, options, onChange = () => {}}) => {
    const [value, setValue] = useState(defaultValue);

    const setValueCallback = useCallback(
        event => {
            let value = event.target.value;
            if (!Number.isNaN(Number(value))) {
                value = Number.parseInt(value);
            }
            setValue(value);
            onChange(value);
        },
        [value, options]
    );

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    if (!Object.keys(options).length) return null;

    return react.createElement(
        "div",
        {
            className: "setting-row"
        },
        react.createElement(
            "label",
            {
                className: "col description"
            },
            name
        ),
        react.createElement(
            "div",
            {
                className: "col action"
            },
            react.createElement(
                "select",
                {
                    className: "main-dropDown-dropDown",
                    value,
                    onChange: setValueCallback
                },
                Object.keys(options).map(item =>
                    react.createElement(
                        "option",
                        {
                            value: item
                        },
                        options[item]
                    )
                )
            )
        )
    );
};

const ConfigInput = ({name, defaultValue, onChange = () => {}}) => {
    const [value, setValue] = useState(defaultValue);

    const setValueCallback = useCallback(
        event => {
            const value = event.target.value;
            setValue(value);
            onChange(value);
        },
        [value]
    );

    return react.createElement(
        "div",
        {
            className: "setting-row"
        },
        react.createElement(
            "label",
            {
                className: "col description"
            },
            name
        ),
        react.createElement(
            "div",
            {
                className: "col action"
            },
            react.createElement("input", {
                value,
                onChange: setValueCallback
            })
        )
    );
};

const ConfigAdjust = ({name, defaultValue, step, min, max, onChange = () => {}}) => {
    const [value, setValue] = useState(defaultValue);

    function adjust(dir) {
        let temp = value + dir * step;
        if (temp < min) {
            temp = min;
        } else if (temp > max) {
            temp = max;
        }
        setValue(temp);
        onChange(temp);
    }

    return react.createElement(
        "div",
        {
            className: "setting-row"
        },
        react.createElement(
            "label",
            {
                className: "col description"
            },
            name
        ),
        react.createElement(
            "div",
            {
                className: "col action"
            },
            react.createElement(SwapButton, {
                icon: `<path d="M2 7h12v2H0z"/>`,
                onClick: () => adjust(-1),
                disabled: value === min
            }),
            react.createElement(
                "p",
                {
                    className: "adjust-value"
                },
                value
            ),
            react.createElement(SwapButton, {
                icon: Spicetify.SVGIcons.plus2px,
                onClick: () => adjust(1),
                disabled: value === max
            })
        )
    );
};

const ConfigHotkey = ({name, defaultValue, onChange = () => {}}) => {
    const [value, setValue] = useState(defaultValue);
    const [trap] = useState(new Spicetify.Mousetrap());

    function record() {
        trap.handleKey = (character, modifiers, e) => {
            if (e.type === "keydown") {
                const sequence = [...new Set([...modifiers, character])];
                if (sequence.length === 1 && sequence[0] === "esc") {
                    onChange("");
                    setValue("");
                    return;
                }
                setValue(sequence.join("+"));
            }
        };
    }

    function finishRecord() {
        trap.handleKey = () => {
        };
        onChange(value);
    }

    return react.createElement(
        "div",
        {
            className: "setting-row"
        },
        react.createElement(
            "label",
            {
                className: "col description"
            },
            name
        ),
        react.createElement(
            "div",
            {
                className: "col action"
            },
            react.createElement("input", {
                value,
                onFocus: record,
                onBlur: finishRecord
            })
        )
    );
};

const ServiceAction = ({item, setTokenCallback}) => {
    switch (item.name) {
        case "local":
            return react.createElement(CacheButton);
        case "musixmatch":
            return react.createElement(RefreshTokenButton, {setTokenCallback});
        default:
            return null;
    }
};

const ServiceOption = ({item, onToggle, onSwap, isFirst = false, isLast = false, onTokenChange = null}) => {
    const [token, setToken] = useState(item.token);
    const [active, setActive] = useState(item.on);

    const setTokenCallback = useCallback(
        token => {
            setToken(token);
            onTokenChange(item.name, token);
        },
        [item.token]
    );

    const toggleActive = useCallback(() => {
        if (item.name === "genius" && spotifyVersion >= "1.2.31") return;
        const state = !active;
        setActive(state);
        onToggle(item.name, state);
    }, [active]);
    return react.createElement(
        "div",
        null,
        react.createElement(
            "div",
            {
                className: "setting-row"
            },
            react.createElement(
                "h3",
                {
                    className: "col description"
                },
                item.name
            ),
            react.createElement(
                "div",
                {
                    className: "col action"
                },
                react.createElement(ServiceAction, {
                    item,
                    setTokenCallback
                }),
                react.createElement(SwapButton, {
                    icon: Spicetify.SVGIcons["chart-up"],
                    onClick: () => onSwap(item.name, -1),
                    disabled: isFirst
                }),
                react.createElement(SwapButton, {
                    icon: Spicetify.SVGIcons["chart-down"],
                    onClick: () => onSwap(item.name, 1),
                    disabled: isLast
                }),
                react.createElement(ButtonSVG, {
                    icon: Spicetify.SVGIcons.check,
                    active,
                    onClick: toggleActive
                })
            )
        ),
        react.createElement("span", {
            dangerouslySetInnerHTML: {
                __html: item.desc
            }
        }),
        item.token !== undefined &&
        react.createElement("input", {
            placeholder: `Place your ${item.name} token here`,
            value: token,
            onChange: event => setTokenCallback(event.target.value)
        })
    );
};

const ServiceList = ({itemsList, onListChange = () => {}, onToggle = () => {}, onTokenChange = () => {}}) => {
    const [items, setItems] = useState(itemsList);
    const maxIndex = items.length - 1;

    const onSwap = useCallback(
        (name, direction) => {
            const curPos = items.findIndex(val => val === name);
            const newPos = curPos + direction;
            [items[curPos], items[newPos]] = [items[newPos], items[curPos]];
            onListChange(items);
            setItems([...items]);
        },
        [items]
    );

    return items.map((key, index) => {
        const item = CONFIG.providers[key] || CONFIG.translate[key];
        item.name = key;
        return react.createElement(ServiceOption, {
            item,
            key,
            isFirst: index === 0,
            isLast: index === maxIndex,
            onSwap,
            onTokenChange,
            onToggle
        });
    });
};

const OptionList = ({type, items, onChange}) => {
    const [itemList, setItemList] = useState(items);
    const [, forceUpdate] = useState();

    useEffect(() => {
        if (!type) return;

        const eventListener = event => {
            if (event.detail?.type !== type) return;
            setItemList(event.detail.items);
        };
        document.addEventListener("lyrics-plus", eventListener);

        return () => document.removeEventListener("lyrics-plus", eventListener);
    }, []);

    return itemList.map(item => {
        if (!item || (item.when && !item.when())) {
            return;
        }

        const onChangeItem = item.onChange || onChange;

        return react.createElement(
            "div",
            null,
            react.createElement(item.type, {
                ...item,
                name: item.desc,
                defaultValue: CONFIG.visual[item.key],
                onChange: value => {
                    onChangeItem(item.key, value);
                    forceUpdate({});
                }
            }),
            item.info &&
            react.createElement("span", {
                dangerouslySetInnerHTML: {
                    __html: item.info
                }
            })
        );
    });
};

function openConfig() {
    const configContainer = react.createElement(
        "div",
        {
            id: `${APP_NAME}-config-container`
        },
        react.createElement("h2", null, "Options"),
        react.createElement(OptionList, {
            items: [
                {
                    desc: "播放栏按钮",
                    key: "playbar-button",
                    info: "将 Spotify 的歌词按钮替换为 Lyrics Plus.",
                    type: ConfigSlider
                },
                {
                    desc: "全局延迟",
                    info: "所有轨道的偏移（以毫秒为单位）.",
                    key: "global-delay",
                    type: ConfigAdjust,
                    min: -10000,
                    max: 10000,
                    step: 250
                },
                {
                    desc: "字体大小",
                    info: "（或在主应用程序中按 Ctrl + 鼠标滚动）",
                    key: "font-size",
                    type: ConfigAdjust,
                    min: fontSizeLimit.min,
                    max: fontSizeLimit.max,
                    step: fontSizeLimit.step
                },
                {
                    desc: "歌词对齐",
                    key: "alignment",
                    type: ConfigSelection,
                    options: {
                        left: "Left",
                        center: "Center",
                        right: "Right"
                    }
                },
                {
                    desc: "全屏热键",
                    key: "fullscreen-key",
                    type: ConfigHotkey
                },
                {
                    desc: "紧凑同步：之前显示的行",
                    key: "lines-before",
                    type: ConfigSelection,
                    options: [0, 1, 2, 3, 4]
                },
                {
                    desc: "紧凑同步：之后显示的行",
                    key: "lines-after",
                    type: ConfigSelection,
                    options: [0, 1, 2, 3, 4]
                },
                {
                    desc: "紧凑同步：淡出模糊",
                    key: "fade-blur",
                    type: ConfigSlider
                },
                {
                    desc: "噪声叠加",
                    key: "noise",
                    type: ConfigSlider
                },
                {
                    desc: "多彩背景",
                    key: "colorful",
                    type: ConfigSlider
                },
                {
                    desc: "背景颜色",
                    key: "background-color",
                    type: ConfigInput,
                    when: () => !CONFIG.visual.colorful
                },
                {
                    desc: "活动文本颜色",
                    key: "active-color",
                    type: ConfigInput,
                    when: () => !CONFIG.visual.colorful
                },
                {
                    desc: "非活动文本颜色",
                    key: "inactive-color",
                    type: ConfigInput,
                    when: () => !CONFIG.visual.colorful
                },
                {
                    desc: "突出显示文本背景",
                    key: "highlight-color",
                    type: ConfigInput,
                    when: () => !CONFIG.visual.colorful
                },
                {
                    desc: "文本转换：日语检测阈值（高级）",
                    info: "检查假名是否在歌词中占主导地位。如果结果通过阈值，则很可能是日语，反之亦然。此设置以百分比表示.",
                    key: "ja-detect-threshold",
                    type: ConfigAdjust,
                    min: thresholdSizeLimit.min,
                    max: thresholdSizeLimit.max,
                    step: thresholdSizeLimit.step
                },
                {
                    desc: "文本转换：繁简检测阈值（高级）",
                    info: "检查歌词中是否以繁体或简体为主。如果结果通过阈值，则很可能是简化的，反之亦然。此设置以百分比表示.",
                    key: "hans-detect-threshold",
                    type: ConfigAdjust,
                    min: thresholdSizeLimit.min,
                    max: thresholdSizeLimit.max,
                    step: thresholdSizeLimit.step
                }
            ],
            onChange: (name, value) => {
                CONFIG.visual[name] = value;
                localStorage.setItem(`${APP_NAME}:visual:${name}`, value);
                lyricContainerUpdate?.();

                const configChange = new CustomEvent("lyrics-plus", {
                    detail: {
                        type: "config",
                        name: name,
                        value: value
                    }
                });
                window.dispatchEvent(configChange);
            }
        }),
        react.createElement("h2", null, "翻译配置"),
        react.createElement(ServiceList, {
            itemsList: Object.keys(CONFIG.translate),
            onToggle: (name, value) => {
                CONFIG.translate[name].on = value;
                localStorage.setItem(`${APP_NAME}:translate:${name}:on`, value);
                lyricContainerUpdate?.();
            },
            onTokenChange: (name, value) => {
                CONFIG.translate[name].token = value;
                localStorage.setItem(`${APP_NAME}:translate:${name}:token`, value);
            }
        }),
        react.createElement("h2", null, "歌词配置"),
        react.createElement(ServiceList, {
            itemsList: CONFIG.providersOrder,
            onListChange: list => {
                CONFIG.providersOrder = list;
                localStorage.setItem(`${APP_NAME}:services-order`, JSON.stringify(list));
            },
            onToggle: (name, value) => {
                CONFIG.providers[name].on = value;
                localStorage.setItem(`${APP_NAME}:provider:${name}:on`, value);
                lyricContainerUpdate?.();
            },
            onTokenChange: (name, value) => {
                CONFIG.providers[name].token = value;
                localStorage.setItem(`${APP_NAME}:provider:${name}:token`, value);
            }
        })
    );

    Spicetify.PopupModal.display({
        title: "Lyrics Plus",
        content: configContainer,
        isLarge: true
    });
}
