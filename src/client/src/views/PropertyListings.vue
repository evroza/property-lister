<template>
  <div class="property-listings">
    <!-- Display the data with a structured table following columns, element-ui is ready for use -->
    <!-- property.name | property.location.country | property.reviews.summary.score -->
    <!-- 9. Do a simple pagination of 5 per page-->
    <!-- 10. Hide the entry without country and/or score-->
  </div>
  <div class="properties">
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" />
    <el-table v-loading="loading" :data="hotels" style="width: 100%">
      <el-table-column prop="propertyId" label="propertyId" width="auto" />
      <el-table-column prop="ActiveExpression.meta.property.name" label="name" width="auto" />
      <el-table-column prop="ActiveExpression.meta.property.location.country" label="country" width="auto" />
      <el-table-column prop="ActiveExpression.meta.property.reviews.summary.score" label="score/100" width="auto" />
      <el-table-column fixed="right" label="Operations" width="auto">
        <template #default="scope">
          <el-button id="update" size="small" @click="updateHandler(scope.row)"
            >View</el-button>
          <el-button id="delete" size="small" type="danger" @click="deleteHandler(scope.row.id)">
            Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogFormVisible" :title="activeExpression?.meta?.property?.name">
      <div style="display: grid; grid-template-columns: 0.6fr 0.4fr; grid-gap: 15px;">
        <img :alt="activeExpression.meta.property.name" :src="activeExpression.meta.property.heroImage.url" style="border-radius: 5px;"/>
        <div>
          <el-radio-group v-model="expressionsRadio">
            <el-radio
              v-for="(expression, i) in expressions"
              :key="expression.id"
              :label="i"
              @click="switchExpression(expression)"
              size="large">
              {{ formatTime(expression.createdAt) }}
            </el-radio>
          </el-radio-group>
        </div>
      </div>
    <el-form style="margin-top: 30px;" :model="form">
      <el-form-item label="Name" :label-width="formLabelWidth">
        <el-input v-model="form.name" autocomplete="off" />
      </el-form-item>
      <el-form-item label="Country" :label-width="formLabelWidth">
        <el-input v-model="form.country" autocomplete="off" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogFormVisible = false">Cancel</el-button>
        <el-button v-if="editing" type="primary" @click="dialogFormVisible = false">
          Save
        </el-button>
        <el-button v-else type="primary" @click="toggleEdit">
          Edit
        </el-button>
      </span>
    </template>
  </el-dialog>
  </div>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus';
import moment from 'moment';

export default {
  data() {
    return {
      hotels: [],
      hotel: {},
      loading: null,
      errorMessage: null,
      dialogFormVisible: ref(false),
      form: {
        name: '',
      },
      editing: false,
      expressions: [],
      activeExpression: {},
      expressionsRadio: '',
    };
  },
  mounted() {
    this.fetchListings();
  },
  methods: {
    async fetchListings() {
      try {
        this.errorMessage = null;
        this.loading = ref(true);

        const response = await axios.get('http://localhost:3001/listings');
        this.hotels = response.data;

        this.loading = ref(false);
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    async fetchDetailListing(id) {
      try {
        this.errorMessage = null;
        this.loading = ref(true);

        const response = await axios.get(`http://localhost:3001/listings/${id}`);
        this.hotel = response.data;

        this.loading = ref(false);
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    async updateHandler(obj) {
      this.dialogFormVisible = true;

      await this.fetchDetailListing(obj.id);

      if (Object.keys(this.hotel).length) {
        const activeExpression = this.hotel.Expressions.find((el) => el.id === obj.activeExpression);
        this.expressions = this.hotel.Expressions;
        this.activeExpression = activeExpression;

        this.form = {
          name: this.activeExpression.meta.property.name,
          country: this.activeExpression.meta.property.location.country,
        };
      }
    },

    async deleteHandler(id) {
      try {
        const { confirmed } = await this.confirmDeleteHandler();
        if (confirmed) {
          const url = `http://localhost:3001/listings/${id}`;
          await axios.delete(url);
          this.fetchListings();

          this.showNotification('You have deleted the listing');
        }
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    async confirmDeleteHandler() {
      try {
        const confirmed = await ElMessageBox.confirm(
          'The listing will be deleted. Continue?',
          'Warning',
          {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning',
          },
        );
        return Promise.resolve({ confirmed });
      } catch (err) {
        this.showMessage('Delete canceled', 'info');
        return Promise.reject(err);
      }
    },

    showNotification(message) {
      ElNotification({
        title: 'Success',
        message,
        type: 'success',
      });
    },

    showMessage(message, type) {
      ElMessage({
        message,
        type,
      });
    },

    toggleEdit() {
      this.editing = true;
    },

    formatTime(time) {
      return moment(time).fromNow();
    },

    switchExpression(expression) {
      this.activeExpression = expression;
    },
  },
};

</script>
