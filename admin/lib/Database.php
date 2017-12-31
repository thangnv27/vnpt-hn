<?php

class Database extends PDO {

    function __construct() {
        try {
            parent::__construct('mysql:host=localhost;dbname=vnpthn_news', 'vnpthn_news', 'rtHWEzo0b', array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ));
//            Registry::$connection_count++;
        } catch (PDOException $e) {
            Debug::throwException("Database error!", $e);
        }
    }

    /**
     * Where
     * @param string|array $arg The WHERE query part
     * <p>
     * <b>Example 1:</b><br />"id=$id, username=$username"
     * <b>Example 2:</b><br />array("id" => $id, "username" => $username)
     * </p>
     * @return string
     */
    public function where($arg = '') {
        if (is_array($arg)) {
            $arr_str = array();
            foreach ($arg as $key => $var) {
                if(is_string($var)){
                    $arr_str[] = "`" . $key . "`=" . $this->quote($var) . "";
                } elseif (empty($var)) {
                    $arr_str[] = "`" . $key . "`='" . $var . "'";
                } else {
                    $arr_str[] = "`" . $key . "`=" . $var . "";
                }
            }
            $where = implode(' AND ', $arr_str);
        } elseif (is_string($arg)) {
            $where = $arg;
        }
        return $where;
    }

    /**
     * Insert data into database. Return lastInsertId
     * @param type $table A name of table to insert into
     * @param array $data An associative array
     * <p><b>Example:</b><br />array("username" => $username, "password" => $password)</p>
     */
    public function insert($table, $data) {
        if ($table != "" && $data != null && !empty($data)) {
            try {
                ksort($data);

                $fieldNames = implode('`, `', array_keys($data));
                $fieldValues = ':' . implode(', :', array_keys($data));

                $stm = $this->prepare("INSERT INTO `$table` (`$fieldNames`) VALUES ($fieldValues)");

                foreach ($data as $key => $value) {
                    $stm->bindValue(":$key", $value);
                }

                $stm->execute();

                return $this->lastInsertId();
            } catch (Exception $exc) {
                Debug::throwException("Database error!", $exc);
                return FALSE;
            }
        } else {
            Debug::throwException("Database error!", "Missing parameter passed");
            return FALSE;
        }
    }

    /**
     * Select
     * @param string $table A name of table
     * @param string|array $fields Fields list name. Result return all of records if array is empty. <b>Example:</b> array('field1', 'field2')
     * @param array $where Paramters to bind. <b>Example:</b> array('field1' => $value1, 'field2' => $value2)
     * @param string $orderby
     * @param string $order
     * @param constant $fetchMode A PDO Fetch mode
     * @return mixed
     */
    public function select($table, $fields = array(), $where = array(), $orderby = "", $order = "ASC", $fetchMode = PDO::FETCH_ASSOC) {
        try {
//            Registry::$query_count++;
            $fieldNames = "*";
            if (is_string($fields)) {
                $fieldNames = $fields;
            } elseif (is_array($fields) and !empty($fields)) {
                $fieldNames = "`" . implode('`, `', $fields) . "`";
            }
            $sql = "SELECT " . $fieldNames . " FROM " . $table;
            if (!empty($where)) {
                $sql .= " WHERE " . $this->where($where);
            }
            if (!empty($orderby)) {
                $sql .= " ORDER BY $orderby $order";
            }
            $stm = $this->prepare($sql);

            if (is_array($where)) {
                foreach ($where as $key => $value) {
                    $stm->bindValue(":$key", $value);
                }
            }
            $stm->execute();
            return $stm->fetchAll($fetchMode);
        } catch (PDOException $exc) {
            if (DEBUG == TRUE) {
                Debug::throwException("Database error!", $exc);
            }
            return array();
        }
    }

    /**
     * Get a record
     * @param string $table A name of table
     * @param string|array $fields Fields list name. Result return all of records if array is empty. <b>Example:</b> array('field1', 'field2')
     * @param array $where Paramters to bind. <b>Example:</b> array('field1' => $value1, 'field2' => $value2)
     * @param string $orderby
     * @param string $order
     * @param constant $fetchMode A PDO Fetch mode
     * @return mixed
     */
    public function get_row($table, $fields = array(), $where = array(), $orderby = "", $order = "ASC", $fetchMode = PDO::FETCH_ASSOC) {
        try {
//            Registry::$query_count++;
            $fieldNames = "*";
            if (is_string($fields)) {
                $fieldNames = $fields;
            } elseif (is_array($fields) and !empty($fields)) {
                $fieldNames = "`" . implode('`, `', $fields) . "`";
            }
            $sql = "SELECT " . $fieldNames . " FROM " . $table;
            if (!empty($where)) {
                $sql .= " WHERE " . $this->where($where);
            }
            if (!empty($orderby)) {
                $sql .= " ORDER BY $orderby $order";
            }
            $sql .= " LIMIT 1";

            $stm = $this->prepare($sql);

            if (is_array($where)) {
                foreach ($where as $key => $value) {
                    $stm->bindValue(":$key", $value);
                }
            }
            $stm->execute();
            $result = $stm->fetchAll($fetchMode);
            if (empty($result))
                return FALSE;
            else
                return $result[0];
        } catch (PDOException $exc) {
            if (DEBUG == TRUE) {
                Debug::throwException("Database error!", $exc);
            }
            return array();
        }
    }

    /**
     * Update
     * @param type $table A name of table to insert into
     * @param array $data An associative array
     * <p><b>Example:</b><br />array("password" => $password)</p>
     * @param string|array $where The WHERE query part
     * <p>
     * <b>Example 1</b>:<br />"id=$id, username=$username"
     * <b>Example 2</b>:<br />array("id" => $id, "username" => $username)
     * </p>
     */
    public function update($table, $data, $where = '') {
        if ($table != "" && $data != null && !empty($data)) {
            try {
                ksort($data);

                $fields = array();
                foreach ($data as $k => $v) {
                    $fields[] = "`$k`=:$k";
                }
                $fields = implode(", ", $fields);
                $sql = "UPDATE `$table` SET $fields";
                if ($where != "" && !empty($where)) {
                    $sql .= " WHERE " . $this->where($where);
                }

                $stm = $this->prepare($sql);

                foreach ($data as $key => $value) {
                    $stm->bindValue(":$key", $value);
                }

                $stm->execute();

                return $stm;
            } catch (Exception $exc) {
                Debug::throwException("Database error!", $exc);
            }
        } else {
            if (DEBUG == TRUE) {
                Debug::throwException("Database error!", "Missing parameter passed");
            }
            return FALSE;
        }
    }

    /**
     * Delete
     * 
     * @param string $table
     * @param string $where
     * @return integer Affected Rows
     */
    public function delete($table, $where) {
        try {
            $where = $this->where($where);
            return $this->exec("DELETE FROM $table WHERE $where");
        } catch (Exception $exc) {
            if (DEBUG == TRUE) {
                Debug::throwException("Database error!", $exc);
            }
            return 0;
        }
    }

    /**
     * Remove all records of a table
     * @param type $table
     */
    public function emptyTable($table) {
        try {
            return $this->exec("TRUNCATE TABLE $table");
        } catch (Exception $exc) {
            if (DEBUG == TRUE) {
                Debug::throwException("Database error!", $exc);
            }
            return 0;
        }
    }

    public function check_exists_table($table_name) {
        $stm = $this->prepare("SHOW TABLES LIKE '$table_name'");
        $stm->execute();
        $result = $stm->fetchAll(PDO::FETCH_ASSOC);
        if (count($result) == 1) {
            return TRUE;
        }
        return FALSE;
    }

}
