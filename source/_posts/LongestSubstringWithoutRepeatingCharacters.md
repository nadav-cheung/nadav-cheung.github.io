---
title: lengthOfLongestSubstring
categories:
  - LeetCode刷题笔记
tags:
  - 算法与数据结构
  - LeetCode
---
在 LeetCode 上，“Longest Substring Without Repeating Characters” 题目要求找出给定字符串中最长的不包含重复字符的子串的长度。这是一个涉及字符串处理和滑动窗口技术的问题。

### Java 解决方案 Map实现

```java
import java.util.HashMap;
import java.util.Map;

public class Solution {
    public int lengthOfLongestSubstring(String s) {
        int n = s.length(), ans = 0;
        Map<Character, Integer> map = new HashMap<>(); // 存储字符及其索引
        for (int end = 0, start = 0; end < n; end++) {
            char alpha = s.charAt(end);
            if (map.containsKey(alpha)) {
                start = Math.max(map.get(alpha), start);
            }
            ans = Math.max(ans, end - start + 1);
            map.put(s.charAt(end), end + 1);
        }
        return ans;
    }
  
  
          public int lengthOfLongestSubstringUseMap(String s) {
            int left = 0;
            int maxLength = 0;
            Map<Character, Integer> charMap = new HashMap<>(s.length());

            for (int right = 0; right < s.length(); right++) {
                if (!charMap.containsKey(s.charAt(right)) || charMap.get(s.charAt(right)) < left) {
                    charMap.put(s.charAt(right), right);
                    maxLength = Math.max(maxLength, right - left + 1);
                } else {
                    left = charMap.get(s.charAt(right)) + 1;
                    charMap.put(s.charAt(right), right);
                }
            }
            return maxLength;
        }
  
  
}



```

### 解释

1. **初始化变量**：定义字符串的长度 `n`，最大子串长度 `ans` 和用于跟踪字符索引的哈希表 `map`。

2. **遍历字符串**：使用两个指针，`start` 和 `end`，来定义当前考虑的子串。`end` 用于遍历字符串，`start` 用于跟踪不含重复字符的子串的开始位置。

3. **更新指针和哈希表**：对于每个字符：
   - 如果字符已在哈希表中（即之前出现过），则更新 `start` 以确保子串不包含重复字符。
   - 更新 `ans` 为当前最长子串的长度。
   - 将当前字符及其索引放入哈希表中。

4. **返回结果**：遍历完成后，`ans` 存储着最长不重复字符子串的长度。

这种解法的时间复杂度为 O(n)，其中 n 是字符串的长度。空间复杂度为 O(min(m, n))，其中 m 是字符集的大小，这是因为哈希表最多包含 m 个键值对。

**Java 解决方案 Set实现**

```java
public int lengthOfLongestSubstring(String s) {
    int left = 0;
    int maxLength = 0;
    Set<Character> charSet = new HashSet<>(s.length());

    for (int right = 0; right < s.length(); right++) {
        if (!charSet.contains(s.charAt(right))) {
            charSet.add(s.charAt(right));
            maxLength = Math.max(maxLength, right - left + 1);
        } else {
            while (charSet.contains(s.charAt(right))) {
                charSet.remove(s.charAt(left));
                left++;
            }
            charSet.add(s.charAt(right));
        }
    }
    return maxLength;
}
```

### 解释

1. **初始化变量**：定义字符串的长度 `n`，最大子串长度 `maxLength` 和用于跟踪字符是否会出现重复 `set`。

2. **遍历字符串**：使用两个指针，`left` 和 `right`，来定义当前考虑的子串。`right` 用于遍历字符串，`left` 用于跟踪不含重复字符的子串的开始位置。

3. **更新指针和集合：对于每个字符：

   - 如果字符没有在集合Set中（即之前没有出现过），将当前字符放入Set，同时更新 `maxLength`，更新 `maxLength` 为当前最长子串的长度。。

   - 如果字符已在集合Set中（即之前出现过），则更新 `left` 以确保子串不包含重复字符。
   - 将当前字符放入Set集合中。

4. **返回结果**：遍历完成后，`ans` 存储着最长不重复字符子串的长度。

**Java 解决方案 Array实现**

```java
        public int lengthOfLongestSubstringUseArray(String s) {
            int n = s.length();
            int maxLength = 0;
            int[] charIndex = new int[128];
            Arrays.fill(charIndex, -1);
            int left = 0;

            for (int right = 0; right < n; right++) {
                if (charIndex[s.charAt(right)] >= left) {
                    left = charIndex[s.charAt(right)] + 1;
                }
                charIndex[s.charAt(right)] = right;
                maxLength = Math.max(maxLength, right - left + 1);
            }

            return maxLength;
        }
```

**解释**

1、**知识储备：**

1. 在 Java 语言中，`char` 和 `int` 之间的关系可以从以下几个方面理解：
   1. **基本类型**：`char` 和 `int` 都是 Java 的基本数据类型。`char` 用于存储单个字符，例如 'A' 或 '9'，而 `int` 用于存储整数。
   2. **数值表示**：Java 中的 `char` 是一个 16 位的无符号整数，用于表示 Unicode 字符。每个字符实际上都有一个对应的整数值。例如，字符 'A' 的 Unicode/ASCII 码是 65。因此，`char` 可以直接转换成 `int` 类型，这个转换会得到字符的整数 Unicode 码。
   3. **转换**：
      - **从 `char` 到 `int`**：当你将 `char` 类型的变量赋值给 `int` 类型的变量时，`char` 类型的变量会自动提升为 `int` 类型，转换为相应的 Unicode 编码的数值。
      - **从 `int` 到 `char`**：如果你将 `int` 类型的变量赋值给 `char` 类型的变量，你需要进行显式类型转换。这是因为 `int` 是一个更大的数据类型，可能包含 `char` 无法表示的值。
   4. **字符编码**：在字符和整数之间转换时，实际上是根据字符的编码表（如 ASCII 或 Unicode）进行的。这意味着，字符 'A' 被存储为其 ASCII 码 65 的 `int` 表示。
   5. **使用场景**：虽然 `char` 和 `int` 可以相互转换，但它们用于不同的场景。`char` 专门用于处理字符数据，而 `int` 用于更广泛的整数计算。

​	6、**ASCII 表：**

​	ASCII 表涉及列出从 0 到 127 的所有字符及其对应的 ASCII 码值。ASCII 表通常包括控制字符（0-31 和 127），可打印字符（32-126）。控制字符是非打印的，用于控制设备的行为，如换行或退格。

下面是完整的 ASCII 表格的一个示例：

### ASCII 表

| ASCII 码 | 字符 | ASCII 码 | 字符    | ASCII 码 | 字符 | ASCII 码 | 字符 |
| -------- | ---- | -------- | ------- | -------- | ---- | -------- | ---- |
| 0        | NUL  | 32       | (space) | 64       | @    | 96       | `    |
| 1        | SOH  | 33       | !       | 65       | A    | 97       | a    |
| 2        | STX  | 34       | "       | 66       | B    | 98       | b    |
| 3        | ETX  | 35       | #       | 67       | C    | 99       | c    |
| 4        | EOT  | 36       | $       | 68       | D    | 100      | d    |
| 5        | ENQ  | 37       | %       | 69       | E    | 101      | e    |
| 6        | ACK  | 38       | &       | 70       | F    | 102      | f    |
| 7        | BEL  | 39       | '       | 71       | G    | 103      | g    |
| 8        | BS   | 40       | (       | 72       | H    | 104      | h    |
| 9        | HT   | 41       | )       | 73       | I    | 105      | i    |
| 10       | LF   | 42       | *       | 74       | J    | 106      | j    |
| 11       | VT   | 43       | +       | 75       | K    | 107      | k    |
| 12       | FF   | 44       | ,       | 76       | L    | 108      | l    |
| 13       | CR   | 45       | -       | 77       | M    | 109      | m    |
| 14       | SO   | 46       | .       | 78       | N    | 110      | n    |
| 15       | SI   | 47       | /       | 79       | O    | 111      | o    |
| 16       | DLE  | 48       | 0       | 80       | P    | 112      | p    |
| 17       | DC1  | 49       | 1       | 81       | Q    | 113      | q    |
| 18       | DC2  | 50       | 2       | 82       | R    | 114      | r    |
| 19       | DC3  | 51       | 3       | 83       | S    | 115      | s    |
| 20       | DC4  | 52       | 4       | 84       | T    | 116      | t    |
| 21       | NAK  | 53       | 5       | 85       | U    | 117      | u    |
| 22       | SYN  | 54       | 6       | 86       | V    | 118      | v    |
| 23       | ETB  | 55       | 7       | 87       | W    | 119      | w    |
| 24       | CAN  | 56       | 8       | 88       | X    | 120      | x    |
| 25       | EM   | 57       | 9       | 89       | Y    | 121      | y    |
| 26       | SUB  | 58       | :       | 90       | Z    | 122      | z    |
| 27       | ESC  | 59       | ;       | 91       | [    | 123      | {    |
| 28       | FS   | 60       | <       | 92       | \    | 124      |      |

2、**解题思路**

1. **初始化变量**：定义字符串的长度 `n`，最大子串长度 `maxLength` 和用于跟踪字符是否会出现重复 `Array`。数组Array记录字符出现的索引，重复字符记录最新一次出现的索引
2. **遍历字符串**：使用两个指针，`left` 和 `right`，来定义当前考虑的子串。`right` 用于遍历字符串，`left` 用于跟踪不含重复字符的子串的开始位置。
3. **更新指针和集合：对于每个字符：
   - 如果字符已经在数组中出现过，harIndex[s.charAt(right)] >= left，则更新 `left` 以确保子串不包含重复字符。
   - 更新 `ans` 为当前最长子串的长度。
   - 将当前字符出现的位置更新到数组中。
4. **返回结果**：遍历完成后，`ans` 存储着最长不重复字符子串的长度。